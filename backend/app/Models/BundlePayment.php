<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BundlePayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'bundle_enrollment_id',
        'user_id',
        'bundle_id',
        'amount',
        'currency',
        'provider',
        'provider_ref',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function bundleEnrollment(): BelongsTo
    {
        return $this->belongsTo(BundleEnrollment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bundle(): BelongsTo
    {
        return $this->belongsTo(Bundle::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(PaymentEvent::class);
    }
}
