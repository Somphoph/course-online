<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BundleEnrollmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'approved_at' => $this->approved_at,
            'created_at' => $this->created_at,
            'bundle' => $this->whenLoaded('bundle', fn () => new BundleResource($this->bundle)),
            'user' => $this->whenLoaded('user', fn () => new UserResource($this->user)),
            'payment' => $this->whenLoaded('payment', fn () => [
                'id' => $this->payment->id,
                'amount' => $this->payment->amount,
                'currency' => $this->payment->currency,
                'provider' => $this->payment->provider,
                'provider_ref' => $this->payment->provider_ref,
                'status' => $this->payment->status,
            ]),
        ];
    }
}
