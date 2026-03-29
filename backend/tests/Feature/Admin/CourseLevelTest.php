<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CourseLevelTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->admin()->create();
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Test Course',
            'description' => 'A description',
            'price' => 990,
            'slug' => 'test-course',
            'is_published' => false,
            'level' => 'Beginner',
        ], $overrides);
    }

    public function test_create_course_without_level_returns_422(): void
    {
        Sanctum::actingAs($this->admin());

        $payload = $this->validPayload();
        unset($payload['level']);

        $this->postJson('/api/admin/courses', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['level']);
    }

    public function test_create_course_with_invalid_level_returns_422(): void
    {
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/admin/courses', $this->validPayload(['level' => 'Expert']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['level']);
    }

    public function test_create_course_with_valid_level_returns_level_in_response(): void
    {
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/admin/courses', $this->validPayload(['level' => 'Advanced']))
            ->assertCreated()
            ->assertJsonPath('data.level', 'Advanced');
    }

    public function test_update_course_level(): void
    {
        Sanctum::actingAs($this->admin());

        $course = \App\Models\Course::factory()->create(['level' => 'Beginner']);

        $this->putJson("/api/admin/courses/{$course->id}", ['level' => 'Intermediate'])
            ->assertOk()
            ->assertJsonPath('data.level', 'Intermediate');
    }

    public function test_public_course_list_includes_level(): void
    {
        \App\Models\Course::factory()->create([
            'is_published' => true,
            'level' => 'Advanced',
            'slug' => 'adv-course',
        ]);

        $this->getJson('/api/courses')
            ->assertOk()
            ->assertJsonPath('data.0.level', 'Advanced');
    }
}
