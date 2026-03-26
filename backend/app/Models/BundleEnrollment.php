<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BundleEnrollment extends Model
{
    use HasFactory;

    protected $table = 'package_enrollments';

    protected $fillable = [
        'user_id',
        'package_id',
        'status',
        'slip_image_path',
        'approved_at',
        'approved_by',
    ];

    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bundle(): BelongsTo
    {
        return $this->belongsTo(Bundle::class, 'package_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function payment(): HasOne
    {
        return $this->hasOne(BundlePayment::class, 'package_enrollment_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }
}
