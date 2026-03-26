<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BundlePayment extends Model
{
    use HasFactory;

    protected $table = 'package_payments';

    protected $fillable = [
        'package_enrollment_id',
        'user_id',
        'package_id',
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
        return $this->belongsTo(BundleEnrollment::class, 'package_enrollment_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bundle(): BelongsTo
    {
        return $this->belongsTo(Bundle::class, 'package_id');
    }
}
