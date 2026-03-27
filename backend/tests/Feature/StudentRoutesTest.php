<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;
use App\Services\BunnyVideoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_student_routes_allow_enrollment_and_video_access(): void
    {
        Storage::fake('local');

        $student = User::factory()->create();
        $enrollmentCourse = Course::factory()->create();
        $videoCourse = Course::factory()->create();
        $lesson = Lesson::factory()->create([
            'course_id' => $videoCourse->id,
        ]);

        Enrollment::factory()->approved()->create([
            'user_id' => $student->id,
            'course_id' => $videoCourse->id,
        ]);
        $this->mock(BunnyVideoService::class, function ($mock): void {
            $mock->shouldReceive('generateSignedUrl')
                ->once()
                ->andReturn('https://signed.example/video');
        });

        Sanctum::actingAs($student);

        $this->postJson('/api/enrollments', [
            'course_id' => $enrollmentCourse->id,
            'slip_image' => UploadedFile::fake()->create('slip.jpg', 100, 'image/jpeg'),
        ])
            ->assertCreated()
            ->assertJsonPath('data.course.id', $enrollmentCourse->id);

        $this->getJson('/api/enrollments')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->getJson("/api/lessons/{$lesson->id}/video-url")
            ->assertOk()
            ->assertJsonPath('signed_url', 'https://signed.example/video');
    }
}
