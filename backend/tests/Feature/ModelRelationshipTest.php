<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModelRelationshipTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_has_many_enrollments(): void
    {
        $user = User::factory()->create();
        $course = Course::factory()->create();

        Enrollment::factory()->create([
            'user_id' => $user->id,
            'course_id' => $course->id,
        ]);

        $this->assertCount(1, $user->enrollments);
    }

    public function test_course_has_many_lessons(): void
    {
        $course = Course::factory()->create();

        Lesson::factory()->count(3)->create([
            'course_id' => $course->id,
        ]);

        $this->assertCount(3, $course->lessons);
    }

    public function test_course_scope_published(): void
    {
        Course::factory()->create(['is_published' => true]);
        Course::factory()->create(['is_published' => false]);

        $this->assertCount(1, Course::published()->get());
    }

    public function test_enrollment_has_one_payment(): void
    {
        $user = User::factory()->create();
        $course = Course::factory()->create();
        $enrollment = Enrollment::factory()->create([
            'user_id' => $user->id,
            'course_id' => $course->id,
        ]);

        Payment::factory()->create([
            'enrollment_id' => $enrollment->id,
            'user_id' => $user->id,
            'course_id' => $course->id,
        ]);

        $this->assertNotNull($enrollment->payment);
    }
}
