<?php

namespace Tests\Feature\Admin;

use App\Models\Course;
use App\Models\Bundle;
use App\Models\BundleEnrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BundleAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_crud_bundles_and_manage_courses(): void
    {
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        Bundle::factory()->published()->create();
        $course = Course::factory()->create();

        $this->getJson('/api/admin/bundles')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $createdResponse = $this->postJson('/api/admin/bundles', [
            'title' => 'Admin bundle',
            'description' => 'Bundle description',
            'price' => 2500,
            'is_published' => false,
        ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Admin bundle');

        $bundleId = $createdResponse->json('data.id');

        $this->putJson("/api/admin/bundles/{$bundleId}", [
            'title' => 'Updated bundle',
        ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Updated bundle');

        $this->postJson("/api/admin/bundles/{$bundleId}/courses", [
            'course_id' => $course->id,
        ])->assertOk();

        $this->putJson("/api/admin/bundles/{$bundleId}", [
            'is_published' => true,
        ])
            ->assertOk()
            ->assertJsonPath('data.is_published', true);

        $this->deleteJson("/api/admin/bundles/{$bundleId}/courses/{$course->id}")
            ->assertNoContent();

        $this->deleteJson("/api/admin/bundles/{$bundleId}")
            ->assertNoContent();
    }

    public function test_admin_cannot_publish_empty_bundle(): void
    {
        $admin = User::factory()->admin()->create();
        $bundle = Bundle::factory()->create(['is_published' => false]);

        Sanctum::actingAs($admin);

        $this->putJson("/api/admin/bundles/{$bundle->id}", [
            'is_published' => true,
        ])->assertStatus(422);
    }

    public function test_admin_cannot_delete_bundle_with_active_enrollments(): void
    {
        $admin = User::factory()->admin()->create();
        $bundle = Bundle::factory()->published()->create();
        BundleEnrollment::factory()->create([
            'package_id' => $bundle->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($admin);

        $this->deleteJson("/api/admin/bundles/{$bundle->id}")
            ->assertStatus(422);
    }

    public function test_student_cannot_access_admin_bundle_endpoints(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/admin/bundles')
            ->assertForbidden();
    }
}
