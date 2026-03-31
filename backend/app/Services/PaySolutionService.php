<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class PaySolutionService
{
    /**
     * Create a PromptPay QR order with Pay Solution.
     *
     * @return array{qr_image: string, expires_at: string, order_ref: string}
     * @throws RuntimeException when the API call fails
     */
    public function createOrder(float $amount, string $orderRef, string $callbackUrl): array
    {
        $merchantId = config('paysolution.merchant_id');
        $apiKey     = config('paysolution.api_key');
        $secretKey  = config('paysolution.secret_key');

        if (! $merchantId || ! $apiKey || ! $secretKey) {
            throw new RuntimeException('Pay Solution configuration is incomplete.');
        }

        // TODO: Verify exact endpoint, headers, and body fields from merchant docs.
        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$apiKey,
            'Content-Type'  => 'application/json',
        ])->post('https://api.paysolutions.asia/v1/promptpay/order', [
            'merchantId'  => $merchantId,
            'amount'      => number_format($amount, 2, '.', ''),
            'orderId'     => $orderRef,
            'callbackUrl' => $callbackUrl,
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('Pay Solution API error: '.$response->status());
        }

        $data = $response->json();

        // TODO: Confirm actual response field names from merchant docs.
        return [
            'qr_image'   => $data['qrImage'] ?? $data['qr_image'] ?? '',
            'expires_at' => $data['expiresAt'] ?? $data['expires_at'] ?? now()->addMinutes(15)->toISOString(),
            'order_ref'  => $data['orderId'] ?? $data['order_id'] ?? $orderRef,
        ];
    }

    /**
     * Verify the HMAC signature on an incoming webhook request.
     *
     * TODO: Confirm exact signing algorithm and field order from merchant docs.
     * The implementation below uses SHA-256 over the raw request body.
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $secret = config('paysolution.webhook_secret');

        if (! $secret) {
            return false;
        }

        $expected = hash_hmac('sha256', $payload, $secret);

        return hash_equals($expected, $signature);
    }
}
