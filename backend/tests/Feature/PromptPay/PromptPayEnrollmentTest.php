<?php

namespace Tests\Feature\PromptPay;

use App\Models\Bundle;
use App\Models\BundleEnrollment;
use App\Models\BundlePayment;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\User;
use App\Services\PaySolutionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PromptPayEnrollmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_paysolution_service_is_resolvable(): void
    {
        $this->assertInstanceOf(PaySolutionService::class, app(PaySolutionService::class));
    }

    public function test_student_can_create_promptpay_course_payment(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->create([
            'is_published' => true,
            'price' => 990,
        ]);

        Sanctum::actingAs($student);

        $this->mock(PaySolutionService::class, function ($mock): void {
            $mock->shouldReceive('createOrder')
                ->once()
                ->andReturn([
                    'qr_image' => 'data:image/png;base64,AAA',
                    'expires_at' => '2026-03-31T10:15:00Z',
                    'order_ref' => 'ORDER-COURSE-001',
                ]);
        });

        $this->postJson('/api/enrollments', [
            'course_id' => $course->id,
            'payment_method' => 'promptpay',
        ])
            ->assertCreated()
            ->assertJsonPath('payment_method', 'promptpay')
            ->assertJsonPath('entity_type', 'course')
            ->assertJsonPath('amount', 990)
            ->assertJsonPath('order_ref', 'ORDER-COURSE-001');

        $this->assertDatabaseHas('payments', [
            'user_id' => $student->id,
            'course_id' => $course->id,
            'provider' => 'paysolution',
            'provider_ref' => 'ORDER-COURSE-001',
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('payment_events', [
            'event_type' => 'qr_created',
        ]);
    }

    public function test_student_can_create_promptpay_bundle_payment(): void
    {
        $student = User::factory()->create();
        $bundle = Bundle::factory()->published()->create([
            'price' => 1800,
        ]);

        Sanctum::actingAs($student);

        $this->mock(PaySolutionService::class, function ($mock): void {
            $mock->shouldReceive('createOrder')
                ->once()
                ->andReturn([
                    'qr_image' => 'data:image/png;base64,BBB',
                    'expires_at' => '2026-03-31T10:20:00Z',
                    'order_ref' => 'ORDER-BUNDLE-001',
                ]);
        });

        $this->postJson("/api/bundles/{$bundle->id}/purchase", [
            'payment_method' => 'promptpay',
        ])
            ->assertCreated()
            ->assertJsonPath('payment_method', 'promptpay')
            ->assertJsonPath('entity_type', 'bundle')
            ->assertJsonPath('amount', 1800)
            ->assertJsonPath('order_ref', 'ORDER-BUNDLE-001');

        $this->assertDatabaseHas('bundle_payments', [
            'user_id' => $student->id,
            'bundle_id' => $bundle->id,
            'provider' => 'paysolution',
            'provider_ref' => 'ORDER-BUNDLE-001',
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('payment_events', [
            'event_type' => 'qr_created',
        ]);
    }

    public function test_student_can_regenerate_promptpay_course_payment(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->create([
            'is_published' => true,
            'price' => 990,
        ]);
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
            'provider_ref' => 'ORDER-OLD-001',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($student);

        $this->mock(PaySolutionService::class, function ($mock): void {
            $mock->shouldReceive('createOrder')
                ->once()
                ->andReturn([
                    'qr_image' => 'data:image/png;base64,CCC',
                    'expires_at' => '2026-03-31T10:25:00Z',
                    'order_ref' => 'ORDER-COURSE-002',
                ]);
        });

        $this->postJson("/api/enrollments/{$enrollment->id}/promptpay/regenerate")
            ->assertOk()
            ->assertJsonPath('order_ref', 'ORDER-COURSE-002');

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'failed',
        ]);
        $this->assertDatabaseCount('payments', 2);
        $this->assertDatabaseHas('payment_events', [
            'payment_id' => $payment->id,
            'event_type' => 'expired',
        ]);
    }

    public function test_student_can_regenerate_promptpay_bundle_payment(): void
    {
        $student = User::factory()->create();
        $bundle = Bundle::factory()->published()->create([
            'price' => 1800,
        ]);
        $bundleEnrollment = BundleEnrollment::create([
            'user_id' => $student->id,
            'bundle_id' => $bundle->id,
            'status' => 'pending',
        ]);
        $bundlePayment = BundlePayment::create([
            'bundle_enrollment_id' => $bundleEnrollment->id,
            'user_id' => $student->id,
            'bundle_id' => $bundle->id,
            'amount' => 1800,
            'currency' => 'THB',
            'provider' => 'paysolution',
            'provider_ref' => 'ORDER-BUNDLE-OLD-001',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($student);

        $this->mock(PaySolutionService::class, function ($mock): void {
            $mock->shouldReceive('createOrder')
                ->once()
                ->andReturn([
                    'qr_image' => 'data:image/png;base64,DDD',
                    'expires_at' => '2026-03-31T10:35:00Z',
                    'order_ref' => 'ORDER-BUNDLE-002',
                ]);
        });

        $this->postJson("/api/bundle-enrollments/{$bundleEnrollment->id}/promptpay/regenerate")
            ->assertOk()
            ->assertJsonPath('order_ref', 'ORDER-BUNDLE-002');

        $this->assertDatabaseHas('bundle_payments', [
            'id' => $bundlePayment->id,
            'status' => 'failed',
        ]);
        $this->assertDatabaseCount('bundle_payments', 2);
        $this->assertDatabaseHas('payment_events', [
            'bundle_payment_id' => $bundlePayment->id,
            'event_type' => 'expired',
        ]);
    }
}
