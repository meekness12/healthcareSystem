<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class OtpVerification extends Model
{
    use HasFactory;

    protected $table = 'otp_verifications';

    protected $fillable = [
        'email',
        'otp_code',
        'type',
        'expires_at',
        'attempts',
        'verified_at',
        'reset_token',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
        'attempts' => 'integer',
    ];

    /**
     * Scope query to find an active, unexpired OTP for email and type.
     */
    public function scopeActive($query, string $email, string $type)
    {
        return $query->where('email', strtolower(trim($email)))
            ->where('type', $type)
            ->whereNull('verified_at')
            ->where('expires_at', '>', Carbon::now());
    }

    /**
     * Check whether the OTP is currently expired.
     */
    public function isExpired(): bool
    {
        return Carbon::now()->greaterThan($this->expires_at);
    }

    /**
     * Check if max attempts (5) have been reached or exceeded.
     */
    public function isLocked(): bool
    {
        return $this->attempts >= 5;
    }
}
