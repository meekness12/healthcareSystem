<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Payment extends Model
{
    protected $fillable = [
        'invoice_id',
        'patient_id',
        'transaction_reference',
        'amount_rwf',
        'payment_method',
        'payer_phone',
        'payment_status',
        'paid_at',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'amount_rwf' => 'decimal:2',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Generate authentic Rwandan payment transaction reference
     */
    public static function generateTransactionReference(string $method): string
    {
        $datePart = date('ymd');
        $random = strtoupper(Str::random(5));

        $prefix = match (strtolower($method)) {
            'momo' => 'MOMO',
            'airtel_money' => 'AIRTEL',
            'card' => 'CARD',
            'cash' => 'CASH',
            default => 'TXN',
        };

        $reference = "{$prefix}-{$datePart}-{$random}";

        while (static::where('transaction_reference', $reference)->exists()) {
            $random = strtoupper(Str::random(5));
            $reference = "{$prefix}-{$datePart}-{$random}";
        }

        return $reference;
    }

    public function scopeSuccessful(Builder $query): Builder
    {
        return $query->where('payment_status', 'successful');
    }

    public function scopeMethod(Builder $query, ?string $method): Builder
    {
        if ($method && $method !== 'all') {
            return $query->where('payment_method', $method);
        }
        return $query;
    }

    public function scopeDateRange(Builder $query, ?string $from, ?string $to): Builder
    {
        if ($from) {
            $query->whereDate('paid_at', '>=', $from);
        }
        if ($to) {
            $query->whereDate('paid_at', '<=', $to);
        }
        return $query;
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (!$term) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term) {
            $q->where('transaction_reference', 'like', "%{$term}%")
              ->orWhere('payer_phone', 'like', "%{$term}%")
              ->orWhereHas('patient.user', function (Builder $userQuery) use ($term) {
                  $userQuery->where('name', 'like', "%{$term}%")
                            ->orWhere('email', 'like', "%{$term}%");
              });
        });
    }
}
