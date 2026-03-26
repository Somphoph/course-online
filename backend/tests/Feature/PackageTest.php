<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Package;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PackageTest extends TestCase
{
    use RefreshDatabase;

    public function test_published_packages_are_listed_with_savings(): void
    {
        $package = Package::factory()->published()->create(['price' => 1500]);
        $course1 = Course::factory()->create(['price' => 1200]);
        $course2 = Course::factory()->create(['price' => 900]);
        $package->courses()->attach([$course1->id, $course2->id]);

        Package::factory()->create(['is_published' => false]);

        $response = $this->getJson('/api/packages');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $package->id)
            ->assertJsonPath('data.0.individual_total_price', 2100)
            ->assertJsonPath('data.0.savings', 600)
            ->assertJsonCount(2, 'data.0.courses');
    }

    public function test_unpublished_package_detail_returns_404(): void
    {
        $package = Package::factory()->create(['is_published' => false]);

        $this->getJson("/api/packages/{$package->id}")
            ->assertNotFound();
    }

    public function test_published_package_detail_includes_courses(): void
    {
        $package = Package::factory()->published()->create(['price' => 1500]);
        $course = Course::factory()->create(['price' => 1200]);
        $package->courses()->attach($course->id);

        $this->getJson("/api/packages/{$package->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $package->id)
            ->assertJsonPath('data.individual_total_price', 1200)
            ->assertJsonPath('data.savings', -300)
            ->assertJsonCount(1, 'data.courses');
    }
}
