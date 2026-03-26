<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Bundle>
 */
class BundleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'thumbnail' => null,
            'price' => fake()->randomFloat(2, 500, 5000),
            'is_published' => false,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'is_published' => true,
        ]);
    }
}
