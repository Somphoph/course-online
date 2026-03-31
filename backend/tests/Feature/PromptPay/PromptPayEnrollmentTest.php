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
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

    public function test_course_promptpay_cancel_then_manual_submit_reuses_existing_enrollment(): void
    {
        Storage::fake('local');

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
                    'qr_image' => 'data:image/png;base64,EEE',
                    'expires_at' => '2026-03-31T11:00:00Z',
                    'order_ref' => 'ORDER-COURSE-003',
                ]);
        });

        $promptPayResponse = $this->postJson('/api/enrollments', [
            'course_id' => $course->id,
            'payment_method' => 'promptpay',
        ])->assertCreated();

        $enrollmentId = $promptPayResponse->json('entity_id');

        $this->postJson("/api/enrollments/{$enrollmentId}/promptpay/cancel")
            ->assertOk();

        $this->post('/api/enrollments', [
            'course_id' => $course->id,
            'payment_method' => 'manual',
            'slip_image' => UploadedFile::fake()->create('slip.jpg', 100, 'image/jpeg'),
        ])->assertStatus(201);

        $this->assertDatabaseCount('enrollments', 1);
        $this->assertDatabaseHas('enrollments', [
            'id' => $enrollmentId,
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseCount('payments', 2);
        $this->assertDatabaseHas('payments', [
            'enrollment_id' => $enrollmentId,
            'provider' => 'manual',
            'status' => 'pending',
        ]);
    }

    public function test_course_promptpay_cancel_then_new_promptpay_reuses_existing_enrollment(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->create([
            'is_published' => true,
            'price' => 990,
        ]);

        Sanctum::actingAs($student);

        $this->mock(PaySolutionService::class, function ($mock): void {
            $mock->shouldReceive('createOrder')
                ->twice()
                ->andReturn(
                    [
                        'qr_image' => 'data:image/png;base64,FFF',
                        'expires_at' => '2026-03-31T11:10:00Z',
                        'order_ref' => 'ORDER-COURSE-004',
                    ],
                    [
                        'qr_image' => 'data:image/png;base64,GGG',
                        'expires_at' => '2026-03-31T11:20:00Z',
                        'order_ref' => 'ORDER-COURSE-005',
                    ]
                );
        });

        $firstResponse = $this->postJson('/api/enrollments', [
            'course_id' => $course->id,
            'payment_method' => 'promptpay',
        ])->assertCreated();

        $enrollmentId = $firstResponse->json('entity_id');

        $this->postJson("/api/enrollments/{$enrollmentId}/promptpay/cancel")
            ->assertOk();

        $secondResponse = $this->postJson('/api/enrollments', [
            'course_id' => $course->id,
            'payment_method' => 'promptpay',
        ])->assertCreated();

        $secondResponse->assertJsonPath('entity_id', $enrollmentId)
            ->assertJsonPath('order_ref', 'ORDER-COURSE-005');

        $this->assertDatabaseCount('enrollments', 1);
        $this->assertDatabaseCount('payments', 2);
    }

    public function test_student_cannot_create_new_course_payment_when_any_direct_enrollment_is_approved(): void
    {
        Storage::fake('local');

        $student = User::factory()->create();
        $course = Course::factory()->create([
            'is_published' => true,
            'price' => 990,
        ]);

        Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'approved',
        ]);

        Sanctum::actingAs($student);

        $this->post('/api/enrollments', [
            'course_id' => $course->id,
            'payment_method' => 'manual',
            'slip_image' => UploadedFile::fake()->create('slip.jpg', 100, 'image/jpeg'),
        ])->assertStatus(422)
            ->assertJson([
                'message' => 'You are already enrolled in this course.',
            ]);
    }

    public function test_bundle_promptpay_cancel_then_manual_submit_reuses_existing_bundle_enrollment(): void
    {
        Storage::fake('local');

        $student = User::factory()->create();
        $bundle = Bundle::factory()->published()->create([
            'price' => 1800,
        ]);

        Sanctum::actingAs($student);

        $this->mock(PaySolutionService::class, function ($mock): void {
            $mock->shouldReceive('createOrder')
                ->once()
                ->andReturn([
                    'qr_image' => 'data:image/png;base64,HHH',
                    'expires_at' => '2026-03-31T11:30:00Z',
                    'order_ref' => 'ORDER-BUNDLE-003',
                ]);
        });

        $promptPayResponse = $this->postJson("/api/bundles/{$bundle->id}/purchase", [
            'payment_method' => 'promptpay',
        ])->assertCreated();

        $bundleEnrollmentId = $promptPayResponse->json('entity_id');

        $this->postJson("/api/bundle-enrollments/{$bundleEnrollmentId}/promptpay/cancel")
            ->assertOk();

        $this->post("/api/bundles/{$bundle->id}/purchase", [
            'payment_method' => 'manual',
            'slip_image' => UploadedFile::fake()->create('bundle-slip.jpg', 100, 'image/jpeg'),
        ])->assertStatus(201);

        $this->assertDatabaseCount('bundle_enrollments', 1);
        $this->assertDatabaseHas('bundle_enrollments', [
            'id' => $bundleEnrollmentId,
            'user_id' => $student->id,
            'bundle_id' => $bundle->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseCount('bundle_payments', 2);
        $this->assertDatabaseHas('bundle_payments', [
            'bundle_enrollment_id' => $bundleEnrollmentId,
            'provider' => 'manual',
            'status' => 'pending',
        ]);
    }

    public function test_bundle_promptpay_cancel_then_new_promptpay_reuses_existing_bundle_enrollment(): void
    {
        $student = User::factory()->create();
        $bundle = Bundle::factory()->published()->create([
            'price' => 1800,
        ]);

        Sanctum::actingAs($student);

        $this->mock(PaySolutionService::class, function ($mock): void {
            $mock->shouldReceive('createOrder')
                ->twice()
                ->andReturn(
                    [
                        'qr_image' => 'data:image/png;base64,III',
                        'expires_at' => '2026-03-31T11:40:00Z',
                        'order_ref' => 'ORDER-BUNDLE-004',
                    ],
                    [
                        'qr_image' => 'data:image/png;base64,JJJ',
                        'expires_at' => '2026-03-31T11:50:00Z',
                        'order_ref' => 'ORDER-BUNDLE-005',
                    ]
                );
        });

        $firstResponse = $this->postJson("/api/bundles/{$bundle->id}/purchase", [
            'payment_method' => 'promptpay',
        ])->assertCreated();

        $bundleEnrollmentId = $firstResponse->json('entity_id');

        $this->postJson("/api/bundle-enrollments/{$bundleEnrollmentId}/promptpay/cancel")
            ->assertOk();

        $secondResponse = $this->postJson("/api/bundles/{$bundle->id}/purchase", [
            'payment_method' => 'promptpay',
        ])->assertCreated();

        $secondResponse->assertJsonPath('entity_id', $bundleEnrollmentId)
            ->assertJsonPath('order_ref', 'ORDER-BUNDLE-005');

        $this->assertDatabaseCount('bundle_enrollments', 1);
        $this->assertDatabaseCount('bundle_payments', 2);
    }
}
