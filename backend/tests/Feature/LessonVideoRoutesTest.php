<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;
use App\Services\BunnyVideoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LessonVideoRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_get_signed_video_url_for_approved_enrollment(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->create();
        $lesson = Lesson::factory()->create([
            'course_id' => $course->id,
        ]);

        Enrollment::factory()->approved()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
        ]);

        $this->mock(BunnyVideoService::class, function ($mock) use ($lesson): void {
            $mock->shouldReceive('generateSignedUrl')
                ->once()
                ->with($lesson->bunny_video_id)
                ->andReturn('https://signed.example/video');
        });

        Sanctum::actingAs($student);

        $this->getJson("/api/lessons/{$lesson->id}/video-url")
            ->assertOk()
            ->assertJsonPath('signed_url', 'https://signed.example/video');
    }

    public function test_student_cannot_get_signed_video_url_without_approved_enrollment(): void
    {
        $student = User::factory()->create();
        $course = Course::factory()->create();
        $lesson = Lesson::factory()->create([
            'course_id' => $course->id,
        ]);

        Sanctum::actingAs($student);

        $this->getJson("/api/lessons/{$lesson->id}/video-url")
            ->assertForbidden();
    }
}
