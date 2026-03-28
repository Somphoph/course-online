<?php

namespace Tests\Feature\Admin;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Bundle;
use App\Models\BundleEnrollment;
use App\Models\BundlePayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BundleEnrollmentAdminTest extends TestCase
{
    use RefreshDatabase;

    private function createBundleEnrollmentWithPayment(array $overrides = []): BundleEnrollment
    {
        $bundleEnrollment = BundleEnrollment::factory()->create($overrides);
        $bundle = Bundle::findOrFail($bundleEnrollment->bundle_id);

        BundlePayment::create([
            'bundle_enrollment_id' => $bundleEnrollment->id,
            'user_id' => $bundleEnrollment->user_id,
            'amount' => $bundle->price,
            'bundle_id' => $bundleEnrollment->bundle_id,
            'currency' => 'THB',
            'provider' => 'manual',
            'status' => 'pending',
        ]);

        return $bundleEnrollment;
    }

    public function test_admin_can_list_bundle_enrollments(): void
    {
        $admin = User::factory()->admin()->create();
        $this->createBundleEnrollmentWithPayment(['status' => 'pending']);

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/bundle-enrollments')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_can_filter_bundle_enrollments_by_status(): void
    {
        $admin = User::factory()->admin()->create();
        $this->createBundleEnrollmentWithPayment(['status' => 'pending']);
        BundleEnrollment::factory()->approved()->create();

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/bundle-enrollments?status=approved')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_can_approve_bundle_enrollment_and_create_enrollments(): void
    {
        $admin = User::factory()->admin()->create();
        $student = User::factory()->create();
        $bundle = Bundle::factory()->create(['price' => 1500]);
        $course1 = Course::factory()->create();
        $course2 = Course::factory()->create();
        $bundle->courses()->attach([$course1->id, $course2->id]);

        $bundleEnrollment = $this->createBundleEnrollmentWithPayment([
            'user_id' => $student->id,
            'bundle_id' => $bundle->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($admin);

        $this->postJson("/api/admin/bundle-enrollments/{$bundleEnrollment->id}/approve")
            ->assertOk();

        $this->assertDatabaseHas('bundle_enrollments', [
            'id' => $bundleEnrollment->id,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('bundle_payments', [
            'bundle_enrollment_id' => $bundleEnrollment->id,
            'status' => 'success',
        ]);

        $this->assertDatabaseCount('enrollments', 2);
        $this->assertDatabaseHas('enrollments', [
            'user_id' => $student->id,
            'course_id' => $course1->id,
            'status' => 'approved',
            'bundle_enrollment_id' => $bundleEnrollment->id,
        ]);
        $this->assertDatabaseHas('enrollments', [
            'user_id' => $student->id,
            'course_id' => $course2->id,
            'status' => 'approved',
            'bundle_enrollment_id' => $bundleEnrollment->id,
        ]);
    }

    public function test_approve_does_not_duplicate_existing_course_enrollment(): void
    {
        $admin = User::factory()->admin()->create();
        $student = User::factory()->create();
        $bundle = Bundle::factory()->create();
        $course = Course::factory()->create();
        $bundle->courses()->attach($course->id);

        Enrollment::factory()->approved()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
        ]);

        $bundleEnrollment = $this->createBundleEnrollmentWithPayment([
            'user_id' => $student->id,
            'bundle_id' => $bundle->id,
        ]);

        Sanctum::actingAs($admin);

        $this->postJson("/api/admin/bundle-enrollments/{$bundleEnrollment->id}/approve")
            ->assertOk();

        $this->assertSame(1, Enrollment::query()
            ->where('user_id', $student->id)
            ->where('course_id', $course->id)
            ->count());
    }

    public function test_admin_can_reject_bundle_enrollment(): void
    {
        $admin = User::factory()->admin()->create();
        $bundleEnrollment = $this->createBundleEnrollmentWithPayment(['status' => 'pending']);

        Sanctum::actingAs($admin);

        $this->postJson("/api/admin/bundle-enrollments/{$bundleEnrollment->id}/reject")
            ->assertOk();

        $this->assertDatabaseHas('bundle_enrollments', [
            'id' => $bundleEnrollment->id,
            'status' => 'rejected',
        ]);

        $this->assertDatabaseHas('bundle_payments', [
            'bundle_enrollment_id' => $bundleEnrollment->id,
            'status' => 'failed',
        ]);

        $this->assertDatabaseCount('enrollments', 0);
    }

    public function test_admin_can_view_slip(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('slips/test.jpg', 'fake-content');

        $admin = User::factory()->admin()->create();
        $bundleEnrollment = BundleEnrollment::factory()->create([
            'slip_image_path' => 'slips/test.jpg',
        ]);

        Sanctum::actingAs($admin);

        $this->getJson("/api/admin/bundle-enrollments/{$bundleEnrollment->id}/slip")
            ->assertOk();
    }

    public function test_student_cannot_access_admin_bundle_enrollment_endpoints(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/admin/bundle-enrollments')
            ->assertForbidden();
    }
}
