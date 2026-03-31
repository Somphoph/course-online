<?php

namespace Tests\Feature\PromptPay;

use App\Models\BundleEnrollment;
use App\Models\BundlePayment;
use App\Models\Course;
use App\Models\Bundle;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\User;
use App\Services\PaySolutionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebhookControllerTest extends TestCase
{
    use RefreshDatabase;

    private function signedPayload(array $data): array
    {
        $body = json_encode($data);
        $sig  = hash_hmac('sha256', $body, 'test-webhook-secret');
        return [$body, $sig];
    }

    protected function setUp(): void
    {
        parent::setUp();
        config(['paysolution.webhook_secret' => 'test-webhook-secret']);
    }

    public function test_valid_webhook_approves_course_enrollment(): void
    {
        $student    = User::factory()->create();
        $course     = Course::factory()->create(['price' => 990]);
        $enrollment = Enrollment::create([
            'user_id'   => $student->id,
            'course_id' => $course->id,
            'status'    => 'pending',
        ]);
        $payment = Payment::create([
            'enrollment_id' => $enrollment->id,
            'user_id'       => $student->id,
            'course_id'     => $course->id,
            'amount'        => 990,
            'currency'      => 'THB',
            'provider'      => 'paysolution',
            'provider_ref'  => 'ORDER-001',
            'status'        => 'pending',
        ]);

        [$body, $sig] = $this->signedPayload(['orderId' => 'ORDER-001', 'status' => 'success']);

        $this->postJson('/api/webhooks/paysolution', json_decode($body, true), [
            'X-PaySolution-Signature' => $sig,
        ])->assertOk();

        $this->assertDatabaseHas('payments', ['id' => $payment->id, 'status' => 'success']);
        $this->assertDatabaseHas('enrollments', ['id' => $enrollment->id, 'status' => 'approved']);
        $this->assertDatabaseHas('payment_events', ['payment_id' => $payment->id, 'event_type' => 'approved']);
    }

    public function test_invalid_signature_returns_400(): void
    {
        [$body, ] = $this->signedPayload(['orderId' => 'ORDER-002', 'status' => 'success']);

        $this->postJson('/api/webhooks/paysolution', json_decode($body, true), [
            'X-PaySolution-Signature' => 'wrong-signature',
        ])->assertStatus(400);

        $this->assertDatabaseHas('payment_events', ['event_type' => 'webhook_rejected']);
    }

    public function test_duplicate_webhook_is_idempotent(): void
    {
        $student    = User::factory()->create();
        $course     = Course::factory()->create(['price' => 990]);
        $enrollment = Enrollment::create([
            'user_id'   => $student->id,
            'course_id' => $course->id,
            'status'    => 'approved',
        ]);
        Payment::create([
            'enrollment_id' => $enrollment->id,
            'user_id'       => $student->id,
            'course_id'     => $course->id,
            'amount'        => 990,
            'currency'      => 'THB',
            'provider'      => 'paysolution',
            'provider_ref'  => 'ORDER-003',
            'status'        => 'success',
        ]);

        [$body, $sig] = $this->signedPayload(['orderId' => 'ORDER-003', 'status' => 'success']);

        $this->postJson('/api/webhooks/paysolution', json_decode($body, true), [
            'X-PaySolution-Signature' => $sig,
        ])->assertOk();

        $this->assertDatabaseCount('payment_events', 0);
    }

    public function test_valid_webhook_approves_bundle_enrollment(): void
    {
        $student         = User::factory()->create();
        $bundle          = Bundle::factory()->published()->create(['price' => 1800]);
        $course1         = Course::factory()->create();
        $course2         = Course::factory()->create();
        $bundle->courses()->attach([$course1->id, $course2->id]);

        $bundleEnrollment = BundleEnrollment::create([
            'user_id'   => $student->id,
            'bundle_id' => $bundle->id,
            'status'    => 'pending',
        ]);
        $bundlePayment = BundlePayment::create([
            'bundle_enrollment_id' => $bundleEnrollment->id,
            'user_id'              => $student->id,
            'bundle_id'            => $bundle->id,
            'amount'               => 1800,
            'currency'             => 'THB',
            'provider'             => 'paysolution',
            'provider_ref'         => 'ORDER-004',
            'status'               => 'pending',
        ]);

        [$body, $sig] = $this->signedPayload(['orderId' => 'ORDER-004', 'status' => 'success']);

        $this->postJson('/api/webhooks/paysolution', json_decode($body, true), [
            'X-PaySolution-Signature' => $sig,
        ])->assertOk();

        $this->assertDatabaseHas('bundle_payments', ['id' => $bundlePayment->id, 'status' => 'success']);
        $this->assertDatabaseHas('bundle_enrollments', ['id' => $bundleEnrollment->id, 'status' => 'approved']);
        $this->assertDatabaseHas('enrollments', ['user_id' => $student->id, 'course_id' => $course1->id, 'status' => 'approved']);
        $this->assertDatabaseHas('enrollments', ['user_id' => $student->id, 'course_id' => $course2->id, 'status' => 'approved']);
    }
}
