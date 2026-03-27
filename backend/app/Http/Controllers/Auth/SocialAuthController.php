<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    private const ALLOWED_PROVIDERS = ['google', 'facebook'];

    public function redirect(string $provider)
    {
        abort_unless(in_array($provider, self::ALLOWED_PROVIDERS), 404);

        return Socialite::driver($provider)->stateless()->redirect();
    }

    public function callback(string $provider)
    {
        abort_unless(in_array($provider, self::ALLOWED_PROVIDERS), 404);

        $frontendUrl = config('app.frontend_url');

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Throwable $e) {
            Log::warning("Social login {$provider} failed: " . $e->getMessage());
            return redirect("{$frontendUrl}/login?error=cancelled");
        }

        if (is_null($socialUser->getEmail())) {
            return redirect("{$frontendUrl}/login?error=email_required");
        }

        $field = $provider . '_id';

        // 1. Find by provider ID
        $user = User::where($field, $socialUser->getId())->first();

        if ($user) {
            // Refresh avatar on every login
            $user->update(['avatar' => $socialUser->getAvatar()]);
        }

        // 2. Find by email → merge
        if (! $user) {
            $user = User::where('email', $socialUser->getEmail())->first();
            if ($user) {
                $user->update([
                    $field    => $socialUser->getId(),
                    'avatar'  => $socialUser->getAvatar(),
                ]);
            }
        }

        // 3. Create new user
        if (! $user) {
            $user = User::create([
                'name' => $socialUser->getName(),
                'email' => $socialUser->getEmail(),
                $field => $socialUser->getId(),
                'avatar' => $socialUser->getAvatar(),
                'password' => null,
            ]);
        }

        $token = $user->createToken('social-auth')->plainTextToken;

        return redirect("{$frontendUrl}/auth/callback?token={$token}");
    }
}
