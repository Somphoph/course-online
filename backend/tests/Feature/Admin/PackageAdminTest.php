<?php

namespace Tests\Feature\Admin;

use App\Models\Course;
use App\Models\Package;
use App\Models\PackageEnrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PackageAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_crud_packages_and_manage_courses(): void
    {
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        Package::factory()->published()->create();
        $course = Course::factory()->create();

        $this->getJson('/api/admin/packages')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $createdResponse = $this->postJson('/api/admin/packages', [
            'title' => 'Admin package',
            'description' => 'Package description',
            'price' => 2500,
            'is_published' => false,
        ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Admin package');

        $packageId = $createdResponse->json('data.id');

        $this->putJson("/api/admin/packages/{$packageId}", [
            'title' => 'Updated package',
        ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Updated package');

        $this->postJson("/api/admin/packages/{$packageId}/courses", [
            'course_id' => $course->id,
        ])->assertOk();

        $this->putJson("/api/admin/packages/{$packageId}", [
            'is_published' => true,
        ])
            ->assertOk()
            ->assertJsonPath('data.is_published', true);

        $this->deleteJson("/api/admin/packages/{$packageId}/courses/{$course->id}")
            ->assertNoContent();

        $this->deleteJson("/api/admin/packages/{$packageId}")
            ->assertNoContent();
    }

    public function test_admin_cannot_publish_empty_package(): void
    {
        $admin = User::factory()->admin()->create();
        $package = Package::factory()->create(['is_published' => false]);

        Sanctum::actingAs($admin);

        $this->putJson("/api/admin/packages/{$package->id}", [
            'is_published' => true,
        ])->assertStatus(422);
    }

    public function test_admin_cannot_delete_package_with_active_enrollments(): void
    {
        $admin = User::factory()->admin()->create();
        $package = Package::factory()->published()->create();
        PackageEnrollment::factory()->create([
            'package_id' => $package->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($admin);

        $this->deleteJson("/api/admin/packages/{$package->id}")
            ->assertStatus(422);
    }

    public function test_student_cannot_access_admin_package_endpoints(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/admin/packages')
            ->assertForbidden();
    }
}
