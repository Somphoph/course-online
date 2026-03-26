<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Package;
use App\Models\PackageEnrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PackageEnrollmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_purchase_package_and_create_payment(): void
    {
        Storage::fake('local');

        $student = User::factory()->create();
        $package = Package::factory()->published()->create(['price' => 1800]);
        $course1 = Course::factory()->create();
        $course2 = Course::factory()->create();
        $package->courses()->attach([$course1->id, $course2->id]);

        Sanctum::actingAs($student);

        $response = $this->postJson("/api/bundles/{$package->id}/purchase", [
            'slip_image' => UploadedFile::fake()->create('slip.jpg', 100, 'image/jpeg'),
        ]);

        $response->assertCreated()
            ->assertJsonPath('package_enrollment.status', 'pending')
            ->assertJsonCount(0, 'already_enrolled_courses');

        $this->assertDatabaseHas('package_enrollments', [
            'user_id' => $student->id,
            'package_id' => $package->id,
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('package_payments', [
            'user_id' => $student->id,
            'package_id' => $package->id,
            'amount' => '1800.00',
            'status' => 'pending',
        ]);
    }

    public function test_purchase_response_includes_already_enrolled_courses(): void
    {
        Storage::fake('local');

        $student = User::factory()->create();
        $package = Package::factory()->published()->create(['price' => 1800]);
        $course1 = Course::factory()->create(['title' => 'Laravel API']);
        $course2 = Course::factory()->create(['title' => 'Next.js Basics']);
        $package->courses()->attach([$course1->id, $course2->id]);

        Enrollment::factory()->approved()->create([
            'user_id' => $student->id,
            'course_id' => $course1->id,
        ]);

        Sanctum::actingAs($student);

        $response = $this->postJson("/api/bundles/{$package->id}/purchase", [
            'slip_image' => UploadedFile::fake()->create('slip.jpg', 100, 'image/jpeg'),
        ]);

        $response->assertCreated()
            ->assertJsonCount(1, 'already_enrolled_courses')
            ->assertJsonPath('already_enrolled_courses.0.id', $course1->id)
            ->assertJsonPath('already_enrolled_courses.0.title', 'Laravel API');
    }

    public function test_purchase_on_unpublished_package_returns_404(): void
    {
        Storage::fake('local');

        $student = User::factory()->create();
        $package = Package::factory()->create(['is_published' => false]);

        Sanctum::actingAs($student);

        $this->postJson("/api/bundles/{$package->id}/purchase", [
            'slip_image' => UploadedFile::fake()->create('slip.jpg', 100, 'image/jpeg'),
        ])->assertNotFound();
    }

    public function test_unauthenticated_purchase_returns_401(): void
    {
        Storage::fake('local');

        $package = Package::factory()->published()->create();

        $this->postJson("/api/bundles/{$package->id}/purchase", [
            'slip_image' => UploadedFile::fake()->create('slip.jpg', 100, 'image/jpeg'),
        ])->assertUnauthorized();
    }

    public function test_student_can_list_their_package_enrollments(): void
    {
        $student = User::factory()->create();
        $packageEnrollment = PackageEnrollment::factory()->create([
            'user_id' => $student->id,
        ]);

        Sanctum::actingAs($student);

        $this->getJson('/api/bundle-enrollments')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $packageEnrollment->id);
    }
}
