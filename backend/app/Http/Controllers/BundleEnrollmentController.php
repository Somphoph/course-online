<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseBundleRequest;
use App\Http\Resources\BundleEnrollmentResource;
use App\Models\Course;
use App\Models\Bundle;
use App\Models\BundleEnrollment;
use App\Models\BundlePayment;
use App\Models\PaymentEvent;
use App\Services\PaySolutionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BundleEnrollmentController extends Controller
{
    public function __construct(private PaySolutionService $paySolution) {}

    public function index(Request $request): JsonResponse
    {
        $bundleEnrollments = BundleEnrollment::query()
            ->with(['bundle.courses', 'user'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'data' => BundleEnrollmentResource::collection($bundleEnrollments),
        ]);
    }

    public function store(PurchaseBundleRequest $request, Bundle $bundle): JsonResponse
    {
        abort_unless($bundle->is_published, 404);

        $bundle->load('courses');
        $paymentMethod = $request->validated()['payment_method'] ?? 'manual';
        $existingBundleEnrollment = BundleEnrollment::query()
            ->where('user_id', $request->user()->id)
            ->where('bundle_id', $bundle->id)
            ->where('status', '!=', 'approved')
            ->latest('id')
            ->first();

        $alreadyEnrolledCourses = Course::query()
            ->whereIn('id', $bundle->courses->pluck('id'))
            ->whereHas('enrollments', function ($query) use ($request): void {
                $query->where('user_id', $request->user()->id)
                    ->where('status', 'approved');
            })
            ->get();

        if ($paymentMethod === 'promptpay') {
            return $this->storePromptPayBundlePurchase(
                $request,
                $bundle,
                $alreadyEnrolledCourses,
                $existingBundleEnrollment
            );
        }

        $bundleEnrollment = DB::transaction(function () use ($request, $bundle, $existingBundleEnrollment): BundleEnrollment {
            $slipPath = $request->file('slip_image')->store('slips', 'local');

            $bundleEnrollment = $this->resolveBundleEnrollment(
                $request->user()->id,
                $bundle->id,
                $existingBundleEnrollment,
                $slipPath
            );

            $this->failPendingBundlePayments($bundleEnrollment);

            BundlePayment::create([
                'bundle_enrollment_id' => $bundleEnrollment->id,
                'user_id' => $request->user()->id,
                'bundle_id' => $bundle->id,
                'amount' => $bundle->price,
                'currency' => 'THB',
                'provider' => 'manual',
                'status' => 'pending',
            ]);

            return $bundleEnrollment;
        });

        return response()->json([
            'bundle_enrollment' => new BundleEnrollmentResource($bundleEnrollment->load(['bundle.courses', 'user'])),
            'already_enrolled_courses' => $alreadyEnrolledCourses->map(fn (Course $course): array => [
                'id' => $course->id,
                'title' => $course->title,
            ])->values(),
        ], 201);
    }

    public function paymentStatus(Request $request, BundleEnrollment $bundleEnrollment): JsonResponse
    {
        abort_unless($bundleEnrollment->user_id === $request->user()->id, 404);

        $payment = $bundleEnrollment->payment()->latest('id')->first();

        return response()->json([
            'status' => $bundleEnrollment->status,
            'payment_status' => $payment?->status,
            'payment_method' => $payment?->provider === 'paysolution' ? 'promptpay' : 'manual',
            'expires_at' => $this->resolvePaymentExpiry($payment),
        ]);
    }

    public function regeneratePromptPay(Request $request, BundleEnrollment $bundleEnrollment): JsonResponse
    {
        abort_unless($bundleEnrollment->user_id === $request->user()->id, 404);

        $bundle = $bundleEnrollment->bundle()->with('courses')->firstOrFail();

        $payload = DB::transaction(function () use ($request, $bundleEnrollment, $bundle): array {
            $previousPayment = $bundleEnrollment->payment()
                ->where('provider', 'paysolution')
                ->where('status', 'pending')
                ->latest('id')
                ->first();

            if ($previousPayment) {
                $previousPayment->update(['status' => 'failed']);

                PaymentEvent::create([
                    'bundle_payment_id' => $previousPayment->id,
                    'event_type' => 'expired',
                    'payload' => ['action' => 'regenerate'],
                ]);
            }

            return $this->createPromptPayPayload($request->user()->id, $bundleEnrollment, $bundle, collect());
        });

        return response()->json($payload);
    }

    public function cancelPromptPay(Request $request, BundleEnrollment $bundleEnrollment): JsonResponse
    {
        abort_unless($bundleEnrollment->user_id === $request->user()->id, 404);

        $payment = $bundleEnrollment->payment()
            ->where('provider', 'paysolution')
            ->where('status', 'pending')
            ->latest('id')
            ->first();

        if ($payment) {
            $payment->update(['status' => 'failed']);

            PaymentEvent::create([
                'bundle_payment_id' => $payment->id,
                'event_type' => 'failed',
                'payload' => ['action' => 'cancel'],
            ]);
        }

        return response()->json(['message' => 'PromptPay payment cancelled.']);
    }

    private function storePromptPayBundlePurchase(
        PurchaseBundleRequest $request,
        Bundle $bundle,
        $alreadyEnrolledCourses,
        ?BundleEnrollment $existingBundleEnrollment
    ): JsonResponse {
        $payload = DB::transaction(function () use ($request, $bundle, $alreadyEnrolledCourses, $existingBundleEnrollment): array {
            $bundleEnrollment = $this->resolveBundleEnrollment(
                $request->user()->id,
                $bundle->id,
                $existingBundleEnrollment,
                null
            );

            $this->failPendingBundlePayments($bundleEnrollment);

            return $this->createPromptPayPayload(
                $request->user()->id,
                $bundleEnrollment,
                $bundle,
                $alreadyEnrolledCourses
            );
        });

        return response()->json($payload, 201);
    }

    private function createPromptPayPayload(
        int $userId,
        BundleEnrollment $bundleEnrollment,
        Bundle $bundle,
        $alreadyEnrolledCourses
    ): array {
        $payment = BundlePayment::create([
            'bundle_enrollment_id' => $bundleEnrollment->id,
            'user_id' => $userId,
            'bundle_id' => $bundle->id,
            'amount' => $bundle->price,
            'currency' => 'THB',
            'provider' => 'paysolution',
            'status' => 'pending',
        ]);

        $orderRef = sprintf('BND-%d-%s', $payment->id, Str::upper(Str::random(8)));
        $order = $this->paySolution->createOrder(
            (float) $bundle->price,
            $orderRef,
            url('/api/webhooks/paysolution')
        );

        $payment->update([
            'provider_ref' => $order['order_ref'],
        ]);

        PaymentEvent::create([
            'bundle_payment_id' => $payment->id,
            'event_type' => 'qr_created',
            'payload' => $order,
        ]);

        if ($alreadyEnrolledCourses->isNotEmpty()) {
            PaymentEvent::create([
                'bundle_payment_id' => $payment->id,
                'event_type' => 'retry',
                'payload' => [
                    'already_enrolled_courses' => $alreadyEnrolledCourses->map(fn (Course $course): array => [
                        'id' => $course->id,
                        'title' => $course->title,
                    ])->values()->all(),
                ],
            ]);
        }

        return [
            'payment_method' => 'promptpay',
            'entity_type' => 'bundle',
            'entity_id' => $bundleEnrollment->id,
            'payment_id' => $payment->id,
            'order_ref' => $order['order_ref'],
            'qr_image' => $order['qr_image'],
            'expires_at' => $order['expires_at'],
            'amount' => (float) $bundle->price,
            'currency' => 'THB',
            'payment_status' => $payment->status,
            'already_enrolled_courses' => $alreadyEnrolledCourses->map(fn (Course $course): array => [
                'id' => $course->id,
                'title' => $course->title,
            ])->values()->all(),
        ];
    }

    private function resolvePaymentExpiry(?BundlePayment $payment): ?string
    {
        if (! $payment || $payment->provider !== 'paysolution') {
            return null;
        }

        $event = $payment->events()
            ->where('event_type', 'qr_created')
            ->latest('id')
            ->first();

        return data_get($event?->payload, 'expires_at');
    }

    private function resolveBundleEnrollment(
        int $userId,
        int $bundleId,
        ?BundleEnrollment $existingBundleEnrollment,
        ?string $slipPath
    ): BundleEnrollment {
        if ($existingBundleEnrollment) {
            $existingBundleEnrollment->update([
                'status' => 'pending',
                'slip_image_path' => $slipPath,
                'approved_at' => null,
                'approved_by' => null,
            ]);

            return $existingBundleEnrollment->fresh();
        }

        return BundleEnrollment::create([
            'user_id' => $userId,
            'bundle_id' => $bundleId,
            'status' => 'pending',
            'slip_image_path' => $slipPath,
        ]);
    }

    private function failPendingBundlePayments(BundleEnrollment $bundleEnrollment): void
    {
        $pendingPayments = BundlePayment::query()
            ->where('bundle_enrollment_id', $bundleEnrollment->id)
            ->where('status', 'pending')
            ->get();

        foreach ($pendingPayments as $payment) {
            $payment->update(['status' => 'failed']);

            if ($payment->provider === 'paysolution') {
                PaymentEvent::create([
                    'bundle_payment_id' => $payment->id,
                    'event_type' => 'failed',
                    'payload' => ['action' => 'switch_method'],
                ]);
            }
        }
    }
}
