<?php

namespace Tests\Feature\PromptPay;

use App\Models\BundleEnrollment;
use App\Models\BundlePayment;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\PaymentEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_read_their_course_payment_status(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->create();
        $enrollment = Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'pending',
        ]);
        $payment = Payment::create([
            'enrollment_id' => $enrollment->id,
            'user_id' => $student->id,
            'course_id' => $course->id,
            'amount' => 990,
            'currency' => 'THB',
            'provider' => 'paysolution',
            'provider_ref' => 'ORDER-STATUS-001',
            'status' => 'pending',
        ]);
        PaymentEvent::create([
            'payment_id' => $payment->id,
            'event_type' => 'qr_created',
            'payload' => ['expires_at' => '2026-03-31T10:30:00Z'],
        ]);

        Sanctum::actingAs($student);

        $this->getJson("/api/enrollments/{$enrollment->id}/payment-status")
            ->assertOk()
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('payment_status', 'pending')
            ->assertJsonPath('payment_method', 'promptpay')
            ->assertJsonPath('expires_at', '2026-03-31T10:30:00Z');
    }

    public function test_student_cannot_read_another_users_course_payment_status(): void
    {
        $owner = User::factory()->create();
        $student = User::factory()->create();
        $course = Course::factory()->create();
        $enrollment = Enrollment::create([
            'user_id' => $owner->id,
            'course_id' => $course->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($student);

        $this->getJson("/api/enrollments/{$enrollment->id}/payment-status")
            ->assertNotFound();
    }

    public function test_student_can_read_their_bundle_payment_status(): void
    {
        $student = User::factory()->create();
        $bundleEnrollment = BundleEnrollment::factory()->create([
            'user_id' => $student->id,
            'status' => 'pending',
        ]);
        $bundlePayment = BundlePayment::create([
            'bundle_enrollment_id' => $bundleEnrollment->id,
            'user_id' => $student->id,
            'bundle_id' => $bundleEnrollment->bundle_id,
            'amount' => 1800,
            'currency' => 'THB',
            'provider' => 'paysolution',
            'provider_ref' => 'ORDER-STATUS-002',
            'status' => 'pending',
        ]);
        PaymentEvent::create([
            'bundle_payment_id' => $bundlePayment->id,
            'event_type' => 'qr_created',
            'payload' => ['expires_at' => '2026-03-31T10:40:00Z'],
        ]);

        Sanctum::actingAs($student);

        $this->getJson("/api/bundle-enrollments/{$bundleEnrollment->id}/payment-status")
            ->assertOk()
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('payment_status', 'pending')
            ->assertJsonPath('payment_method', 'promptpay')
            ->assertJsonPath('expires_at', '2026-03-31T10:40:00Z');
    }

    public function test_student_can_cancel_their_course_promptpay_payment(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->create();
        $enrollment = Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'pending',
        ]);
        $payment = Payment::create([
            'enrollment_id' => $enrollment->id,
            'user_id' => $student->id,
            'course_id' => $course->id,
            'amount' => 990,
            'currency' => 'THB',
            'provider' => 'paysolution',
            'provider_ref' => 'ORDER-CANCEL-001',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($student);

        $this->postJson("/api/enrollments/{$enrollment->id}/promptpay/cancel")
            ->assertOk();

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'failed',
        ]);
        $this->assertDatabaseHas('payment_events', [
            'payment_id' => $payment->id,
            'event_type' => 'failed',
        ]);
    }

    public function test_student_can_cancel_their_bundle_promptpay_payment(): void
    {
        $student = User::factory()->create();
        $bundleEnrollment = BundleEnrollment::factory()->create([
            'user_id' => $student->id,
            'status' => 'pending',
        ]);
        $bundlePayment = BundlePayment::create([
            'bundle_enrollment_id' => $bundleEnrollment->id,
            'user_id' => $student->id,
            'bundle_id' => $bundleEnrollment->bundle_id,
            'amount' => 1800,
            'currency' => 'THB',
            'provider' => 'paysolution',
            'provider_ref' => 'ORDER-CANCEL-002',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($student);

        $this->postJson("/api/bundle-enrollments/{$bundleEnrollment->id}/promptpay/cancel")
            ->assertOk();

        $this->assertDatabaseHas('bundle_payments', [
            'id' => $bundlePayment->id,
            'status' => 'failed',
        ]);
        $this->assertDatabaseHas('payment_events', [
            'bundle_payment_id' => $bundlePayment->id,
            'event_type' => 'failed',
        ]);
    }
}
