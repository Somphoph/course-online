<?php

namespace Tests\Unit;

use App\Services\BunnyVideoService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class BunnyVideoServiceTest extends TestCase
{
    public function test_generate_signed_url_builds_bunny_embed_url(): void
    {
        Config::set('bunny.library_id', '123');
        Config::set('bunny.token_key', 'secret-key');
        Config::set('bunny.cdn_hostname', 'https://iframe.mediadelivery.net');
        Config::set('bunny.token_expiry', 7200);

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-03-25 12:00:00'));

        $service = new BunnyVideoService();
        $url = $service->generateSignedUrl('video-guid-1');

        $expires = CarbonImmutable::now()->addSeconds(7200)->timestamp;
        $expectedToken = hash('sha256', 'secret-key'.'video-guid-1'.$expires);

        $this->assertSame(
            "https://iframe.mediadelivery.net/embed/123/video-guid-1?token={$expectedToken}&expires={$expires}",
            $url
        );

        CarbonImmutable::setTestNow();
    }
}
