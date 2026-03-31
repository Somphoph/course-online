<?php

namespace Tests\Feature\PromptPay;

use App\Services\PaySolutionService;
use Tests\TestCase;

class PromptPayEnrollmentTest extends TestCase
{
    public function test_paysolution_service_is_resolvable(): void
    {
        $this->assertInstanceOf(PaySolutionService::class, app(PaySolutionService::class));
    }
}
