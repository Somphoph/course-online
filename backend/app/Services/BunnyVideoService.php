<?php

namespace App\Services;

use Illuminate\Support\Str;
use RuntimeException;

class BunnyVideoService
{
    public function generateSignedUrl(string $videoId): string
    {
        $libraryId = config('bunny.library_id');
        $tokenKey = config('bunny.token_key');
        $baseUrl = (string) config('bunny.cdn_hostname', 'iframe.mediadelivery.net');
        $baseUrl = rtrim(preg_match('/^https?:\/\//i', $baseUrl) ? $baseUrl : "https://{$baseUrl}", '/');
        $expires = now()->addSeconds((int) config('bunny.token_expiry', 7200))->timestamp;
        $videoId = Str::of($videoId)->trim()->toString();

        if (! $libraryId || ! $tokenKey) {
            throw new RuntimeException('Bunny Stream signing configuration is incomplete.');
        }

        $token = hash('sha256', $tokenKey.$videoId.$expires);

        return "{$baseUrl}/embed/{$libraryId}/{$videoId}?token={$token}&expires={$expires}";
    }
}
