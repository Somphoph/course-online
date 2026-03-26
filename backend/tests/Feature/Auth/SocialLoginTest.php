<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

class SocialLoginTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ────────────────────────────────────────────────────────────

    private function mockSocialiteCallback(string $provider, array $data = []): void
    {
        $socialiteUser = Mockery::mock(\Laravel\Socialite\Contracts\User::class);
        $socialiteUser->shouldReceive('getId')->andReturn($data['id'] ?? 'social_123');
        $socialiteUser->shouldReceive('getEmail')->andReturn($data['email'] ?? null);
        $socialiteUser->shouldReceive('getName')->andReturn($data['name'] ?? 'Social User');
        $socialiteUser->shouldReceive('getAvatar')->andReturn($data['avatar'] ?? null);

        $providerMock = Mockery::mock(Provider::class);
        $providerMock->shouldReceive('stateless')->andReturnSelf();
        $providerMock->shouldReceive('user')->andReturn($socialiteUser);

        Socialite::shouldReceive('driver')->with($provider)->andReturn($providerMock);
    }

    private function mockSocialiteRedirect(string $provider): void
    {
        $providerMock = Mockery::mock(Provider::class);
        $providerMock->shouldReceive('stateless')->andReturnSelf();
        $providerMock->shouldReceive('redirect')->andReturn(
            redirect('https://accounts.google.com/o/oauth2/auth?client_id=test')
        );

        Socialite::shouldReceive('driver')->with($provider)->andReturn($providerMock);
    }

    // ─── Redirect tests ─────────────────────────────────────────────────────

    public function test_redirect_returns_redirect_for_google(): void
    {
        $this->mockSocialiteRedirect('google');

        $response = $this->get('/api/auth/google/redirect');

        $response->assertRedirect();
    }

    public function test_redirect_returns_redirect_for_facebook(): void
    {
        $this->mockSocialiteRedirect('facebook');

        $response = $this->get('/api/auth/facebook/redirect');

        $response->assertRedirect();
    }

    public function test_redirect_returns_404_for_invalid_provider(): void
    {
        $response = $this->get('/api/auth/twitter/redirect');

        $response->assertNotFound();
    }

    public function test_callback_returns_404_for_invalid_provider(): void
    {
        $response = $this->get('/api/auth/twitter/callback');

        $response->assertNotFound();
    }

    public function test_new_google_user_is_created_and_redirected_with_token(): void
    {
        $this->mockSocialiteCallback('google', [
            'id'    => 'google_abc123',
            'email' => 'newuser@example.com',
            'name'  => 'New User',
        ]);

        $response = $this->get('/api/auth/google/callback');

        $response->assertRedirect();
        $location = $response->headers->get('Location');
        parse_str(parse_url($location, PHP_URL_QUERY), $params);
        $this->assertArrayHasKey('token', $params);

        $this->assertDatabaseHas('users', [
            'email'     => 'newuser@example.com',
            'google_id' => 'google_abc123',
            'role'      => 'student',
        ]);
        $this->assertNull(
            \DB::table('users')->where('email', 'newuser@example.com')->value('password')
        );
    }

    // ─── Task 6: Existing social user login ─────────────────────────────────

    public function test_existing_social_user_receives_token(): void
    {
        $user = User::factory()->create([
            'email'     => 'existing@example.com',
            'google_id' => 'google_existing_999',
            'password'  => null,
        ]);

        $this->mockSocialiteCallback('google', [
            'id'    => 'google_existing_999',
            'email' => 'existing@example.com',
            'name'  => 'Existing User',
        ]);

        $response = $this->get('/api/auth/google/callback');

        $response->assertRedirect();
        $location = $response->headers->get('Location');
        parse_str(parse_url($location, PHP_URL_QUERY), $params);
        $this->assertArrayHasKey('token', $params);
        $this->assertDatabaseCount('users', 1);
    }

    // ─── Task 7: Email merge + password preservation ─────────────────────────

    public function test_google_login_merges_with_existing_email_password_account(): void
    {
        $user = User::factory()->create([
            'email'    => 'merge@example.com',
            'password' => 'secret123',
        ]);
        $this->assertNull($user->google_id);

        $this->mockSocialiteCallback('google', [
            'id'    => 'google_merge_777',
            'email' => 'merge@example.com',
            'name'  => 'Merge User',
        ]);

        $response = $this->get('/api/auth/google/callback');

        $response->assertRedirect();
        $location = $response->headers->get('Location');
        parse_str(parse_url($location, PHP_URL_QUERY), $params);
        $this->assertArrayHasKey('token', $params);

        $this->assertDatabaseHas('users', [
            'email'     => 'merge@example.com',
            'google_id' => 'google_merge_777',
        ]);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_merged_user_password_is_preserved(): void
    {
        User::factory()->create([
            'email'    => 'preserve@example.com',
            'password' => 'secret123',
        ]);

        $this->mockSocialiteCallback('google', [
            'id'    => 'google_preserve_888',
            'email' => 'preserve@example.com',
        ]);

        $this->get('/api/auth/google/callback');

        $this->assertNotNull(
            \DB::table('users')->where('email', 'preserve@example.com')->value('password')
        );
    }

    // ─── Task 8: Facebook missing email ──────────────────────────────────────

    public function test_facebook_login_without_email_redirects_with_error(): void
    {
        $this->mockSocialiteCallback('facebook', [
            'id'    => 'fb_no_email',
            'email' => null,
        ]);

        $response = $this->get('/api/auth/facebook/callback');

        $response->assertRedirect();
        $location = $response->headers->get('Location');
        $this->assertStringContainsString('error=email_required', $location);
        $this->assertDatabaseCount('users', 0);
    }
}
