<?php

namespace Tests\Unit;

use App\Services\PaySolutionService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PaySolutionServiceTest extends TestCase
{
    public function test_create_order_uses_configured_endpoint_and_normalizes_response(): void
    {
        config([
            'paysolution.merchant_id' => 'merchant-1',
            'paysolution.api_key' => 'api-key',
            'paysolution.secret_key' => 'secret-key',
            'paysolution.create_order_url' => 'https://merchant.example/promptpay',
            'paysolution.response_map' => [
                'qr_image' => ['data.qrCodeImage', 'qrImage'],
                'expires_at' => ['data.expireAt', 'expiresAt'],
                'order_ref' => ['data.invoiceNo', 'orderId'],
            ],
        ]);

        Http::fake([
            'https://merchant.example/promptpay' => Http::response([
                'data' => [
                    'qrCodeImage' => 'data:image/png;base64,REAL',
                    'expireAt' => '2026-04-01T10:00:00Z',
                    'invoiceNo' => 'INV-001',
                ],
            ]),
        ]);

        $service = app(PaySolutionService::class);
        $result = $service->createOrder(990, 'ORDER-001', 'https://app.test/api/webhooks/paysolution');

        $this->assertSame('data:image/png;base64,REAL', $result['qr_image']);
        $this->assertSame('2026-04-01T10:00:00Z', $result['expires_at']);
        $this->assertSame('INV-001', $result['order_ref']);
    }

    public function test_webhook_helpers_use_configured_keys(): void
    {
        config([
            'paysolution.signature_header' => 'X-Merchant-Signature',
            'paysolution.order_ref_keys' => ['data.invoiceNo', 'orderId'],
            'paysolution.status_keys' => ['data.paymentStatus', 'status'],
            'paysolution.success_statuses' => ['paid_ok'],
        ]);

        $service = app(PaySolutionService::class);
        $payload = [
            'data' => [
                'invoiceNo' => 'INV-002',
                'paymentStatus' => 'PAID_OK',
            ],
        ];

        $this->assertSame('X-Merchant-Signature', $service->signatureHeader());
        $this->assertSame('INV-002', $service->extractOrderRef($payload));
        $this->assertSame('paid_ok', $service->extractStatus($payload));
        $this->assertTrue($service->isSuccessfulStatus('PAID_OK'));
    }
}
