<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Bundle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BundleTest extends TestCase
{
    use RefreshDatabase;

    public function test_published_bundles_are_listed_with_savings(): void
    {
        $bundle = Bundle::factory()->published()->create(['price' => 1500]);
        $course1 = Course::factory()->create(['price' => 1200]);
        $course2 = Course::factory()->create(['price' => 900]);
        $bundle->courses()->attach([$course1->id, $course2->id]);

        Bundle::factory()->create(['is_published' => false]);

        $response = $this->getJson('/api/bundles');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $bundle->id)
            ->assertJsonPath('data.0.individual_total_price', 2100)
            ->assertJsonPath('data.0.savings', 600)
            ->assertJsonCount(2, 'data.0.courses');
    }

    public function test_unpublished_bundle_detail_returns_404(): void
    {
        $bundle = Bundle::factory()->create(['is_published' => false]);

        $this->getJson("/api/bundles/{$bundle->id}")
            ->assertNotFound();
    }

    public function test_published_bundle_detail_includes_courses(): void
    {
        $bundle = Bundle::factory()->published()->create(['price' => 1500]);
        $course = Course::factory()->create(['price' => 1200]);
        $bundle->courses()->attach($course->id);

        $this->getJson("/api/bundles/{$bundle->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $bundle->id)
            ->assertJsonPath('data.individual_total_price', 1200)
            ->assertJsonPath('data.savings', -300)
            ->assertJsonCount(1, 'data.courses');
    }
}
