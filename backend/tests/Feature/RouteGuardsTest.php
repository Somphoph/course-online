<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RouteGuardsTest extends TestCase
{
    use RefreshDatabase;

    public function test_protected_routes_require_authentication(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
        $this->getJson('/api/enrollments')->assertUnauthorized();
        $this->postJson('/api/enrollments', [])->assertUnauthorized();
        $this->getJson('/api/admin/courses')->assertUnauthorized();
    }

    public function test_student_cannot_access_admin_routes(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/admin/courses')->assertForbidden();
        $this->postJson('/api/admin/courses', [
            'title' => 'Forbidden course',
            'description' => 'Not allowed',
            'price' => 1000,
            'slug' => 'forbidden-course',
        ])->assertForbidden();
    }

    public function test_auth_register_validates_required_fields(): void
    {
        $this->postJson('/api/auth/register', [
            'email' => 'missing-name@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_student_enrollment_validates_slip_upload(): void
    {
        Storage::fake('local');

        Sanctum::actingAs(User::factory()->create());
        $course = Course::factory()->create();

        $this->postJson('/api/enrollments', [
            'course_id' => $course->id,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['slip_image']);

        $this->postJson('/api/enrollments', [
            'course_id' => $course->id,
            'slip_image' => UploadedFile::fake()->create('slip.txt', 10, 'text/plain'),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['slip_image']);
    }

    public function test_admin_course_creation_validates_required_fields(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->postJson('/api/admin/courses', [
            'title' => 'Missing description',
            'price' => 1500,
            'slug' => 'missing-description',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['description']);
    }
}
