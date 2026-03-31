<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Arr;
use RuntimeException;

class PaySolutionService
{
    /**
     * Create a PromptPay QR order with Pay Solution.
     *
     * @return array{qr_image: string, expires_at: string, order_ref: string}
     * @throws RuntimeException when config is incomplete or API returns non-2xx
     * @throws \Illuminate\Http\Client\ConnectionException on network/transport failure
     */
    public function createOrder(float $amount, string $orderRef, string $callbackUrl): array
    {
        $merchantId = config('paysolution.merchant_id');
        $apiKey     = config('paysolution.api_key');
        $endpoint   = config('paysolution.create_order_url');

        if (! $merchantId || ! $apiKey || ! $endpoint) {
            throw new RuntimeException('Pay Solution configuration is incomplete.');
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$apiKey,
            'Content-Type'  => 'application/json',
        ])->post($endpoint, [
            'merchantId'  => $merchantId,
            'amount'      => number_format($amount, 2, '.', ''),
            'orderId'     => $orderRef,
            'callbackUrl' => $callbackUrl,
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('Pay Solution API error: '.$response->status());
        }

        $data = $response->json();

        return [
            'qr_image'   => $this->firstMappedValue($data, config('paysolution.response_map.qr_image', []), ''),
            'expires_at' => $this->firstMappedValue(
                $data,
                config('paysolution.response_map.expires_at', []),
                now()->addMinutes(15)->toISOString()
            ),
            'order_ref'  => $this->firstMappedValue($data, config('paysolution.response_map.order_ref', []), $orderRef),
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

    public function signatureHeader(): string
    {
        return (string) config('paysolution.signature_header', 'X-PaySolution-Signature');
    }

    public function extractOrderRef(array $payload): ?string
    {
        return $this->firstMappedValue($payload, config('paysolution.order_ref_keys', []));
    }

    public function extractStatus(array $payload): string
    {
        return strtolower((string) $this->firstMappedValue($payload, config('paysolution.status_keys', []), ''));
    }

    public function isSuccessfulStatus(string $status): bool
    {
        return in_array(strtolower($status), config('paysolution.success_statuses', []), true);
    }

    private function firstMappedValue(array $payload, array $keys, mixed $default = null): mixed
    {
        foreach ($keys as $key) {
            $value = Arr::get($payload, $key);

            if ($value !== null && $value !== '') {
                return $value;
            }
        }

        return $default;
    }
}
