# PromptPay via Pay Solution — Design Spec

**Date:** 2026-03-31  
**Status:** Approved  
**Scope:** Add PromptPay (Pay Solution gateway) as a second payment option alongside existing bank transfer slip upload, for both course enrollments and bundle purchases.

---

## 1. Goals

- Student can choose between **Bank Transfer (manual slip)** or **PromptPay** when enrolling in a course or purchasing a bundle.
- PromptPay payments are **auto-approved instantly** upon Pay Solution webhook confirmation — no admin step needed.
- Bank transfer slip flow is **unchanged**.
- Full **audit trail** via `payment_events` table for every payment lifecycle event.

---

## 2. Architecture

### Payment Method Selection

The enroll/purchase API request gains an optional `payment_method` field:
- `manual` (default) → existing slip upload path, unchanged
- `promptpay` → new Pay Solution path

### PromptPay Flow

1. Frontend sends `POST /api/enrollments` or `POST /api/bundles/{id}/purchase` with `payment_method: 'promptpay'` (no slip file)
2. Backend creates `Enrollment` (`status: pending`) + `Payment` (`provider: 'paysolution'`, `status: pending`)
3. Backend calls Pay Solution API → receives QR code image (base64) + order reference + expiry time
4. Backend stores `provider_ref` = Pay Solution order ref, logs `qr_created` event to `payment_events`
5. Backend returns QR image, expiry timestamp, and `enrollment_id` to frontend
6. Frontend displays QR with countdown timer; polls `GET /api/payments/{enrollment_id}/status` every 3 seconds
7. Student scans QR in banking app and pays
8. Pay Solution calls `POST /api/webhooks/paysolution`
9. Backend verifies HMAC signature → updates `Payment.status = 'success'` and `Enrollment.status = 'approved'` atomically, logs `webhook_received` + `approved` events
10. Next frontend poll detects `approved` → shows success screen → redirects to `/dashboard`

### Existing Bank Transfer Flow

Unchanged. Admin still reviews and approves manually.

---

## 3. Database Changes

### Migrations

**Migration 1:** Add `'paysolution'` to `payments.provider` enum  
`payments` table: `provider` enum `['manual', 'omise', 'stripe', 'paysolution']`

**Migration 2:** Add `'paysolution'` to `package_payments.provider` enum  
`package_payments` table: `provider` enum `['manual', 'paysolution']`

**Migration 3:** Create `payment_events` table

```
payment_events
├── id
├── payment_id          FK → payments.id (nullable — also used for bundle payments)
├── bundle_payment_id   FK → package_payments.id (nullable)
├── event_type          enum: qr_created | webhook_received | approved | failed | expired | retry | webhook_rejected
├── payload             JSON — raw request/response data from Pay Solution
└── created_at
```

### No New Tables for Core Flow

The existing `payments` and `package_payments` tables are sufficient. `provider_ref` stores the Pay Solution order reference.

---

## 4. New Backend Components

### `app/Services/PaySolutionService.php`

Responsibilities:
- `createOrder(amount, orderRef, callbackUrl): array` — POST to Pay Solution API, return `{qr_image, expires_at, order_ref}`
- `verifyWebhookSignature(payload, signature): bool` — HMAC verification using `PAYSOLUTION_WEBHOOK_SECRET`

### `app/Http/Controllers/WebhookController.php`

Route: `POST /api/webhooks/paysolution` (no Sanctum auth — public, but signature-verified)

Logic:
1. Verify HMAC signature → 400 + log `webhook_rejected` if invalid
2. Look up by `provider_ref` — search `payments` first, then `package_payments` (bundles use a separate table)
3. Check if already approved (idempotent) → 200 early return if so
4. If course payment: atomically update `Payment.status = 'success'` + `Enrollment.status = 'approved'` + `approved_at = now()`  
   If bundle payment: atomically update `BundlePayment.status = 'success'` + `BundleEnrollment.status = 'approved'` + `approved_at = now()` + auto-create child `Enrollment` records
5. Log `webhook_received` + `approved` to `payment_events`
6. Return 200

### Payment Status Polling

Two Sanctum-authenticated endpoints — one per enrollment type:

- `GET /api/enrollments/{enrollment_id}/payment-status` — for course enrollments
- `GET /api/bundle-enrollments/{bundle_enrollment_id}/payment-status` — for bundle enrollments

Both return `{ status: 'pending' | 'approved' | 'failed' }` scoped to the authenticated user's own record only.

### Updated Controllers

**`EnrollmentController@store`:**  
If `payment_method === 'promptpay'`: skip slip validation, call `PaySolutionService::createOrder()`, return QR data. Log `qr_created`.

**`BundleEnrollmentController@purchase`:**  
Same pattern as above for bundle payments.

---

## 5. Environment Variables

```env
PAYSOLUTION_MERCHANT_ID=
PAYSOLUTION_API_KEY=
PAYSOLUTION_SECRET_KEY=
PAYSOLUTION_WEBHOOK_SECRET=
```

Store in `.env`. Add to `.env.example` with empty values.

> **Note:** Exact Pay Solution API endpoint URL, request parameters, and response format must be confirmed from Pay Solution merchant credentials and documentation at https://api-docs.paysolutions.asia/docs/api/none-ui-api/promptpay-api

---

## 6. Frontend Changes

### `app/courses/[slug]/enroll/page.jsx`

**New state: payment method selector**

Before the existing slip upload form, add a payment method selection step:
- Option A: Bank Transfer — shows existing slip upload form (unchanged)
- Option B: PromptPay — shows QR code screen after clicking "Continue"

**QR code screen states:**

| State | UI |
|---|---|
| Loading | Spinner while backend creates order |
| Active | QR image + amount + countdown timer + "Waiting for payment…" indicator |
| Expired | Faded QR + "QR Code Expired" message + "Generate New QR" button |
| Success | Redirects to `/dashboard` |

Polling: `GET /api/enrollments/{enrollment_id}/payment-status` (courses) or `GET /api/bundle-enrollments/{id}/payment-status` (bundles) every 3 seconds while QR is active.  
On expiry: POST to create a new payment order (marks old payment as `failed`, creates new one).  
Cancel button: returns to payment method selector, marks pending payment as `failed`.

### `app/bundles/[slug]/purchase/page.jsx` (or equivalent bundle purchase page)

Identical payment method selector and QR screen pattern.

---

## 7. Error Handling

| Scenario | Handling |
|---|---|
| Pay Solution API down on QR create | Return error to frontend: "Unable to generate QR. Please try again." No enrollment created. |
| Webhook signature invalid | Return HTTP 400. Log `webhook_rejected` event with raw payload. Do not approve. |
| Duplicate webhook (same `provider_ref`) | Check if already `approved` → return 200 immediately. Idempotent. |
| Student generates new QR after expiry | Mark old payment `failed` + log `expired` event. Create new Payment record + new QR. |
| Student pays after QR expires | Pay Solution rejects the transaction itself — no charge occurs. |
| Student pays but polling ends before webhook | Webhook approves enrollment in DB. Student sees correct status on next dashboard visit. |

---

## 8. Security

- **Webhook HMAC verification:** Every incoming webhook request must have a valid signature computed with `PAYSOLUTION_WEBHOOK_SECRET`. Reject without signature check is impossible — 400 is returned and event is logged.
- **Polling endpoint auth:** `GET /api/payments/{enrollment_id}/status` is Sanctum-protected. Users can only query their own enrollments.
- **API credentials:** All Pay Solution keys stored in `.env`, never committed to git.
- **Webhook URL:** Must be served over HTTPS in production.
- **No client-side approval:** Enrollment approval only happens via server-side webhook — the frontend poll only reads status, never writes it.

---

## 9. Testing

### Backend (PHPUnit)

- `PaySolutionServiceTest` — mock HTTP client, verify request format, verify signature validation logic
- `WebhookControllerTest` — valid signature approves enrollment; invalid signature returns 400; duplicate webhook is idempotent
- `PaymentStatusTest` — polling endpoint returns correct status; unauthorized users cannot query others' payments
- `PaymentEventsTest` — verify correct events are logged at each lifecycle step
- Update `AdminRoutesTest` / `EnrollmentTest` — existing tests unaffected (manual path unchanged)

### Frontend

- Update `route-smoke.test.mjs` — enroll page still loads correctly
- Manual E2E checklist in PR description: payment method selector, QR display, expiry + retry, success redirect, bank transfer path still works

---

## 10. Out of Scope

- Refunds / chargeback handling
- Payment receipts / email notifications
- Admin dashboard visibility into PromptPay payments (admin can see `approved` enrollments as usual)
- Support for currencies other than THB
