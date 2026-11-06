<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class InsuranceClaim extends Model
{
    protected $fillable = [
        'patient_id',
        'invoice_id',
        'provider_id',
        'claim_reference',
        'claimed_amount_rwf',
        'approved_amount_rwf',
        'claim_status',
        'rejection_reason',
        'submitted_at',
        'processed_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'processed_at' => 'datetime',
        'claimed_amount_rwf' => 'decimal:2',
        'approved_amount_rwf' => 'decimal:2',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function provider()
    {
        return $this->belongsTo(InsuranceProvider::class, 'provider_id');
    }

    /**
     * Generate unique insurance claim reference (e.g. CLM-202611-X489B)
     */
    public static function generateClaimReference(): string
    {
        $prefix = 'CLM-' . date('Ym') . '-';
        $random = strtoupper(Str::random(5));
        $candidate = $prefix . $random;

        while (static::where('claim_reference', $candidate)->exists()) {
            $random = strtoupper(Str::random(5));
            $candidate = $prefix . $random;
        }

        return $candidate;
    }

    public function submit(): void
    {
        $this->claim_status = 'submitted';
        $this->submitted_at = now();
        $this->save();
    }

    public function markUnderReview(): void
    {
        $this->claim_status = 'under_review';
        $this->save();
    }

    public function approve(float $approvedAmount): void
    {
        $this->claim_status = 'approved';
        $this->approved_amount_rwf = $approvedAmount;
        $this->processed_at = now();
        $this->rejection_reason = null;
        $this->save();
    }

    public function reject(string $reason): void
    {
        $this->claim_status = 'rejected';
        $this->rejection_reason = $reason;
        $this->processed_at = now();
        $this->save();
    }

    public function markPaid(): void
    {
        $this->claim_status = 'paid';
        $this->save();
    }

    public function scopeStatus(Builder $query, ?string $status): Builder
    {
        if ($status && $status !== 'all') {
            return $query->where('claim_status', $status);
        }
        return $query;
    }

    public function scopeProvider(Builder $query, ?int $providerId): Builder
    {
        if ($providerId) {
            return $query->where('provider_id', $providerId);
        }
        return $query;
    }

    public function scopeDateRange(Builder $query, ?string $from, ?string $to): Builder
    {
        if ($from) {
            $query->whereDate('submitted_at', '>=', $from);
        }
        if ($to) {
            $query->whereDate('submitted_at', '<=', $to);
        }
        return $query;
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (!$term) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term) {
            $q->where('claim_reference', 'like', "%{$term}%")
              ->orWhereHas('provider', function (Builder $pQ) use ($term) {
                  $pQ->where('provider_name', 'like', "%{$term}%")
                     ->orWhere('provider_code', 'like', "%{$term}%");
              })
              ->orWhereHas('patient.user', function (Builder $uQ) use ($term) {
                  $uQ->where('name', 'like', "%{$term}%")
                     ->orWhere('email', 'like', "%{$term}%");
              });
        });
    }
}
