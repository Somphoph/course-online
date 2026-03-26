<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
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

        $socialUser = Socialite::driver($provider)->stateless()->user();

        if (is_null($socialUser->getEmail())) {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            return redirect("{$frontendUrl}/login?error=email_required");
        }

        $field = $provider . '_id';

        // 1. Find by provider ID
        $user = User::where($field, $socialUser->getId())->first();

        // 2. Find by email → merge
        if (! $user) {
            $user = User::where('email', $socialUser->getEmail())->first();
            if ($user) {
                $user->update([$field => $socialUser->getId()]);
            }
        }

        // 3. Create new user
        if (! $user) {
            $user = User::create([
                'name'     => $socialUser->getName(),
                'email'    => $socialUser->getEmail(),
                $field     => $socialUser->getId(),
                'avatar'   => $socialUser->getAvatar(),
                'password' => null,
            ]);
        }

        $token = $user->createToken('social-auth')->plainTextToken;
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');

        return redirect("{$frontendUrl}/auth/callback?token={$token}");
    }
}
