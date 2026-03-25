<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_auth_routes_allow_registration_and_login(): void
    {
        $email = 'student@example.com';

        $this->postJson('/api/auth/register', [
            'name' => 'Student One',
            'email' => $email,
            'phone' => '0800000000',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
            ->assertCreated()
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email'],
                'token',
            ]);

        $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => 'password123',
        ])
            ->assertOk()
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email'],
                'token',
            ]);
    }
}
