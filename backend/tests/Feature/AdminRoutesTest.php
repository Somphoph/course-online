<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_routes_allow_course_and_enrollment_management(): void
    {
        Storage::fake('local');

        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        Course::factory()->create([
            'title' => 'Existing course',
            'slug' => 'existing-course',
        ]);

        $this->getJson('/api/admin/courses')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $createdCourseResponse = $this->postJson('/api/admin/courses', [
            'title' => 'Admin created course',
            'description' => 'Course description',
            'price' => 1500,
            'slug' => 'admin-created-course',
            'is_published' => true,
        ])
            ->assertCreated();

        $createdCourseId = $createdCourseResponse->json('data.id');

        $this->putJson("/api/admin/courses/{$createdCourseId}", [
            'title' => 'Admin updated course',
        ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Admin updated course');

        $this->deleteJson("/api/admin/courses/{$createdCourseId}")
            ->assertNoContent();

        $student = User::factory()->create();
        $enrollmentCourse = Course::factory()->create();
        $approvedEnrollment = Enrollment::factory()->create([
            'user_id' => $student->id,
            'course_id' => $enrollmentCourse->id,
            'status' => 'pending',
        ]);
        $approvedPayment = Payment::factory()->create([
            'enrollment_id' => $approvedEnrollment->id,
            'user_id' => $student->id,
            'course_id' => $enrollmentCourse->id,
            'status' => 'pending',
        ]);

        $slipPath = UploadedFile::fake()->create('slip.jpg', 100, 'image/jpeg')->store('slips', 'local');
        $approvedEnrollment->update(['slip_image_path' => $slipPath]);

        $this->getJson('/api/admin/enrollments?status=pending')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->postJson("/api/admin/enrollments/{$approvedEnrollment->id}/approve")
            ->assertOk();

        $this->assertSame('approved', $approvedEnrollment->fresh()->status);
        $this->assertSame('success', $approvedPayment->fresh()->status);

        $rejectedEnrollment = Enrollment::factory()->create([
            'user_id' => $student->id,
            'course_id' => Course::factory()->create()->id,
            'status' => 'pending',
        ]);
        $rejectedPayment = Payment::factory()->create([
            'enrollment_id' => $rejectedEnrollment->id,
            'user_id' => $student->id,
            'course_id' => $rejectedEnrollment->course_id,
            'status' => 'pending',
        ]);

        $this->postJson("/api/admin/enrollments/{$rejectedEnrollment->id}/reject")
            ->assertOk();

        $this->assertSame('rejected', $rejectedEnrollment->fresh()->status);
        $this->assertSame('failed', $rejectedPayment->fresh()->status);

        $this->getJson("/api/admin/enrollments/{$approvedEnrollment->id}/slip")
            ->assertOk();

        $anotherStudent = User::factory()->create(['role' => 'student']);
        $anotherCourse = Course::factory()->create();
        Enrollment::factory()->approved()->create([
            'user_id' => $anotherStudent->id,
            'course_id' => $anotherCourse->id,
        ]);

        $this->getJson('/api/admin/students')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }
}
