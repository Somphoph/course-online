<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEnrollmentRequest;
use App\Http\Resources\EnrollmentResource;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\PaymentEvent;
use App\Services\PaySolutionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EnrollmentController extends Controller
{
    public function __construct(private PaySolutionService $paySolution) {}

    public function index(Request $request): JsonResponse
    {
        $enrollments = Enrollment::with(['course', 'payment'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'data' => EnrollmentResource::collection($enrollments),
        ]);
    }

    public function store(StoreEnrollmentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $paymentMethod = $data['payment_method'] ?? 'manual';

        $course = Course::query()->published()->findOrFail($data['course_id']);

        $alreadyEnrolled = Enrollment::query()
            ->where('user_id', $request->user()->id)
            ->where('course_id', $course->id)
            ->whereNull('bundle_enrollment_id')
            ->exists();

        if ($alreadyEnrolled) {
            return response()->json([
                'message' => 'You are already enrolled in this course.',
            ], 422);
        }

        if ($paymentMethod === 'promptpay') {
            return $this->storePromptPayEnrollment($request, $course);
        }

        $slipPath = $request->file('slip_image')->store('slips', 'local');

        $enrollment = DB::transaction(function () use ($request, $course, $slipPath): Enrollment {
            $enrollment = Enrollment::create([
                'user_id' => $request->user()->id,
                'course_id' => $course->id,
                'status' => 'pending',
                'slip_image_path' => $slipPath,
            ]);

            Payment::create([
                'enrollment_id' => $enrollment->id,
                'user_id' => $request->user()->id,
                'course_id' => $course->id,
                'amount' => $course->price,
                'currency' => 'THB',
                'provider' => 'manual',
                'status' => 'pending',
            ]);

            return $enrollment;
        });

        return response()->json([
            'data' => new EnrollmentResource($enrollment->load(['course'])),
        ], 201);
    }

    public function paymentStatus(Request $request, Enrollment $enrollment): JsonResponse
    {
        abort_unless($enrollment->user_id === $request->user()->id, 404);

        $payment = $enrollment->payment()->latest('id')->first();

        return response()->json([
            'status' => $enrollment->status,
            'payment_status' => $payment?->status,
            'payment_method' => $payment?->provider === 'paysolution' ? 'promptpay' : 'manual',
            'expires_at' => $this->resolvePaymentExpiry($payment),
        ]);
    }

    public function regeneratePromptPay(Request $request, Enrollment $enrollment): JsonResponse
    {
        abort_unless($enrollment->user_id === $request->user()->id, 404);

        $course = $enrollment->course()->firstOrFail();

        $payload = DB::transaction(function () use ($request, $enrollment, $course): array {
            $previousPayment = $enrollment->payment()
                ->where('provider', 'paysolution')
                ->where('status', 'pending')
                ->latest('id')
                ->first();

            if ($previousPayment) {
                $previousPayment->update(['status' => 'failed']);

                PaymentEvent::create([
                    'payment_id' => $previousPayment->id,
                    'event_type' => 'expired',
                    'payload' => ['action' => 'regenerate'],
                ]);
            }

            return $this->createPromptPayPayload($request->user()->id, $enrollment, $course);
        });

        return response()->json($payload);
    }

    public function cancelPromptPay(Request $request, Enrollment $enrollment): JsonResponse
    {
        abort_unless($enrollment->user_id === $request->user()->id, 404);

        $payment = $enrollment->payment()
            ->where('provider', 'paysolution')
            ->where('status', 'pending')
            ->latest('id')
            ->first();

        if ($payment) {
            $payment->update(['status' => 'failed']);

            PaymentEvent::create([
                'payment_id' => $payment->id,
                'event_type' => 'failed',
                'payload' => ['action' => 'cancel'],
            ]);
        }

        return response()->json(['message' => 'PromptPay payment cancelled.']);
    }

    private function storePromptPayEnrollment(StoreEnrollmentRequest $request, Course $course): JsonResponse
    {
        $payload = DB::transaction(function () use ($request, $course): array {
            $enrollment = Enrollment::create([
                'user_id' => $request->user()->id,
                'course_id' => $course->id,
                'status' => 'pending',
            ]);

            return $this->createPromptPayPayload($request->user()->id, $enrollment, $course);
        });

        return response()->json($payload, 201);
    }

    private function createPromptPayPayload(int $userId, Enrollment $enrollment, Course $course): array
    {
        $payment = Payment::create([
            'enrollment_id' => $enrollment->id,
            'user_id' => $userId,
            'course_id' => $course->id,
            'amount' => $course->price,
            'currency' => 'THB',
            'provider' => 'paysolution',
            'status' => 'pending',
        ]);

        $orderRef = sprintf('ENR-%d-%s', $payment->id, Str::upper(Str::random(8)));
        $order = $this->paySolution->createOrder(
            (float) $course->price,
            $orderRef,
            url('/api/webhooks/paysolution')
        );

        $payment->update([
            'provider_ref' => $order['order_ref'],
        ]);

        PaymentEvent::create([
            'payment_id' => $payment->id,
            'event_type' => 'qr_created',
            'payload' => $order,
        ]);

        return [
            'payment_method' => 'promptpay',
            'entity_type' => 'course',
            'entity_id' => $enrollment->id,
            'payment_id' => $payment->id,
            'order_ref' => $order['order_ref'],
            'qr_image' => $order['qr_image'],
            'expires_at' => $order['expires_at'],
            'amount' => (float) $course->price,
            'currency' => 'THB',
            'payment_status' => $payment->status,
        ];
    }

    private function resolvePaymentExpiry(?Payment $payment): ?string
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
}
