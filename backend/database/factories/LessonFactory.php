<?php

namespace Database\Factories;

use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Lesson>
 */
class LessonFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'course_id' => Course::factory(),
            'title' => fake()->sentence(4),
            'bunny_video_id' => fake()->uuid(),
            'sort_order' => fake()->numberBetween(1, 100),
            'duration_seconds' => fake()->numberBetween(120, 3600),
            'is_preview' => false,
        ];
    }
}
