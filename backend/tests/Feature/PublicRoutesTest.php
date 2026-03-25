<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_course_routes_return_published_courses_and_preview_lessons(): void
    {
        $course = Course::factory()->create([
            'is_published' => true,
            'slug' => 'excel-fundamentals',
        ]);

        Lesson::factory()->create([
            'course_id' => $course->id,
            'title' => 'Preview lesson',
            'is_preview' => true,
            'sort_order' => 1,
        ]);

        Lesson::factory()->create([
            'course_id' => $course->id,
            'title' => 'Locked lesson',
            'is_preview' => false,
            'sort_order' => 2,
        ]);

        $this->getJson('/api/courses')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'excel-fundamentals');

        $this->getJson('/api/courses/excel-fundamentals')
            ->assertOk()
            ->assertJsonPath('data.slug', 'excel-fundamentals')
            ->assertJsonCount(1, 'data.lessons');
    }
}
