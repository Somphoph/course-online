<?php

namespace App\Http\Controllers;

use App\Models\BundleEnrollment;
use App\Models\BundlePayment;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\PaymentEvent;
use App\Services\PaySolutionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WebhookController extends Controller
{
    public function __construct(private PaySolutionService $paySolution) {}

    public function handlePaySolution(Request $request): JsonResponse
    {
        $signature = $request->header($this->paySolution->signatureHeader(), '');
        $rawBody   = $request->getContent();
        $payload = $request->all();

        if (! $this->paySolution->verifyWebhookSignature($rawBody, $signature)) {
            PaymentEvent::create([
                'event_type' => 'webhook_rejected',
                'payload'    => ['body' => $rawBody, 'signature' => $signature],
            ]);

            return response()->json(['message' => 'Invalid signature'], 400);
        }

        $orderRef = $this->paySolution->extractOrderRef($payload);
        $status = $this->paySolution->extractStatus($payload);

        if (! $this->paySolution->isSuccessfulStatus($status)) {
            $this->recordGatewayFailure($orderRef, $payload);

            return response()->json(['message' => 'ignored']);
        }

        $payment = Payment::where('provider_ref', $orderRef)
            ->where('provider', 'paysolution')
            ->first();

        if ($payment) {
            if ($payment->status === 'success') {
                return response()->json(['message' => 'already processed']);
            }

            $this->recordWebhookReceived(payment: $payment, payload: $payload);

            DB::transaction(function () use ($payment): void {
                $payment->update(['status' => 'success']);
                Enrollment::where('id', $payment->enrollment_id)
                    ->update(['status' => 'approved', 'approved_at' => now()]);
                PaymentEvent::create([
                    'payment_id' => $payment->id,
                    'event_type' => 'approved',
                    'payload'    => [],
                ]);
            });

            return response()->json(['message' => 'ok']);
        }

        // Try bundle payment
        $bundlePayment = BundlePayment::where('provider_ref', $orderRef)
            ->where('provider', 'paysolution')
            ->first();

        if ($bundlePayment) {
            if ($bundlePayment->status === 'success') {
                return response()->json(['message' => 'already processed']);
            }

            $this->recordWebhookReceived(bundlePayment: $bundlePayment, payload: $payload);

            DB::transaction(function () use ($bundlePayment): void {
                $bundlePayment->update(['status' => 'success']);

                $bundleEnrollment = BundleEnrollment::with('bundle.courses')
                    ->findOrFail($bundlePayment->bundle_enrollment_id);

                $bundleEnrollment->update(['status' => 'approved', 'approved_at' => now()]);

                foreach ($bundleEnrollment->bundle->courses as $course) {
                    Enrollment::updateOrCreate(
                        [
                            'user_id' => $bundleEnrollment->user_id,
                            'course_id' => $course->id,
                        ],
                        [
                            'status' => 'approved',
                            'approved_at' => now(),
                            'bundle_enrollment_id' => $bundleEnrollment->id,
                        ]
                    );
                }

                PaymentEvent::create([
                    'bundle_payment_id' => $bundlePayment->id,
                    'event_type'        => 'approved',
                    'payload'           => [],
                ]);
            });

            return response()->json(['message' => 'ok']);
        }

        return response()->json(['message' => 'order not found'], 404);
    }

    private function recordWebhookReceived(?Payment $payment = null, ?BundlePayment $bundlePayment = null, array $payload = []): void
    {
        PaymentEvent::create([
            'payment_id' => $payment?->id,
            'bundle_payment_id' => $bundlePayment?->id,
            'event_type' => 'webhook_received',
            'payload' => $payload,
        ]);
    }

    private function recordGatewayFailure(?string $orderRef, array $payload): void
    {
        $payment = Payment::where('provider_ref', $orderRef)
            ->where('provider', 'paysolution')
            ->first();

        if ($payment) {
            $payment->update(['status' => 'failed']);

            PaymentEvent::create([
                'payment_id' => $payment->id,
                'event_type' => 'failed',
                'payload' => $payload,
            ]);

            return;
        }

        $bundlePayment = BundlePayment::where('provider_ref', $orderRef)
            ->where('provider', 'paysolution')
            ->first();

        if (! $bundlePayment) {
            return;
        }

        $bundlePayment->update(['status' => 'failed']);

        PaymentEvent::create([
            'bundle_payment_id' => $bundlePayment->id,
            'event_type' => 'failed',
            'payload' => $payload,
        ]);
    }
}
