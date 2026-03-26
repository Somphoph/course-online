<?php

namespace Database\Factories;

use App\Models\Bundle;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BundleEnrollment>
 */
class BundleEnrollmentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'package_id' => Bundle::factory(),
            'status' => 'pending',
            'slip_image_path' => null,
            'approved_at' => null,
            'approved_by' => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => 'approved',
            'approved_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => [
            'status' => 'rejected',
        ]);
    }
}
