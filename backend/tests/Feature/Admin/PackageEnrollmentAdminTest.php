<?php

namespace Tests\Feature\Admin;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Package;
use App\Models\PackageEnrollment;
use App\Models\PackagePayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PackageEnrollmentAdminTest extends TestCase
{
    use RefreshDatabase;

    private function createPackageEnrollmentWithPayment(array $overrides = []): PackageEnrollment
    {
        $packageEnrollment = PackageEnrollment::factory()->create($overrides);

        PackagePayment::create([
            'package_enrollment_id' => $packageEnrollment->id,
            'user_id' => $packageEnrollment->user_id,
            'package_id' => $packageEnrollment->package_id,
            'amount' => Package::findOrFail($packageEnrollment->package_id)->price,
            'currency' => 'THB',
            'provider' => 'manual',
            'status' => 'pending',
        ]);

        return $packageEnrollment;
    }

    public function test_admin_can_list_package_enrollments(): void
    {
        $admin = User::factory()->admin()->create();
        $this->createPackageEnrollmentWithPayment(['status' => 'pending']);

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/bundle-enrollments')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_can_filter_package_enrollments_by_status(): void
    {
        $admin = User::factory()->admin()->create();
        $this->createPackageEnrollmentWithPayment(['status' => 'pending']);
        PackageEnrollment::factory()->approved()->create();

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/bundle-enrollments?status=approved')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_can_approve_package_enrollment_and_create_enrollments(): void
    {
        $admin = User::factory()->admin()->create();
        $student = User::factory()->create();
        $package = Package::factory()->create(['price' => 1500]);
        $course1 = Course::factory()->create();
        $course2 = Course::factory()->create();
        $package->courses()->attach([$course1->id, $course2->id]);

        $packageEnrollment = $this->createPackageEnrollmentWithPayment([
            'user_id' => $student->id,
            'package_id' => $package->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($admin);

        $this->postJson("/api/admin/bundle-enrollments/{$packageEnrollment->id}/approve")
            ->assertOk();

        $this->assertDatabaseHas('package_enrollments', [
            'id' => $packageEnrollment->id,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('package_payments', [
            'package_enrollment_id' => $packageEnrollment->id,
            'status' => 'success',
        ]);

        $this->assertDatabaseCount('enrollments', 2);
        $this->assertDatabaseHas('enrollments', [
            'user_id' => $student->id,
            'course_id' => $course1->id,
            'status' => 'approved',
            'package_enrollment_id' => $packageEnrollment->id,
        ]);
        $this->assertDatabaseHas('enrollments', [
            'user_id' => $student->id,
            'course_id' => $course2->id,
            'status' => 'approved',
            'package_enrollment_id' => $packageEnrollment->id,
        ]);
    }

    public function test_approve_allows_duplicate_course_enrollments_from_package(): void
    {
        $admin = User::factory()->admin()->create();
        $student = User::factory()->create();
        $package = Package::factory()->create();
        $course = Course::factory()->create();
        $package->courses()->attach($course->id);

        Enrollment::factory()->approved()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
        ]);

        $packageEnrollment = $this->createPackageEnrollmentWithPayment([
            'user_id' => $student->id,
            'package_id' => $package->id,
        ]);

        Sanctum::actingAs($admin);

        $this->postJson("/api/admin/bundle-enrollments/{$packageEnrollment->id}/approve")
            ->assertOk();

        $this->assertSame(2, Enrollment::query()
            ->where('user_id', $student->id)
            ->where('course_id', $course->id)
            ->count());
    }

    public function test_admin_can_reject_package_enrollment(): void
    {
        $admin = User::factory()->admin()->create();
        $packageEnrollment = $this->createPackageEnrollmentWithPayment(['status' => 'pending']);

        Sanctum::actingAs($admin);

        $this->postJson("/api/admin/bundle-enrollments/{$packageEnrollment->id}/reject")
            ->assertOk();

        $this->assertDatabaseHas('package_enrollments', [
            'id' => $packageEnrollment->id,
            'status' => 'rejected',
        ]);

        $this->assertDatabaseHas('package_payments', [
            'package_enrollment_id' => $packageEnrollment->id,
            'status' => 'failed',
        ]);

        $this->assertDatabaseCount('enrollments', 0);
    }

    public function test_admin_can_view_slip(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('slips/test.jpg', 'fake-content');

        $admin = User::factory()->admin()->create();
        $packageEnrollment = PackageEnrollment::factory()->create([
            'slip_image_path' => 'slips/test.jpg',
        ]);

        Sanctum::actingAs($admin);

        $this->getJson("/api/admin/bundle-enrollments/{$packageEnrollment->id}/slip")
            ->assertOk();
    }

    public function test_student_cannot_access_admin_package_enrollment_endpoints(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/admin/bundle-enrollments')
            ->assertForbidden();
    }
}
