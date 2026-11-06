<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Invoice extends Model
{
    protected $fillable = [
        'patient_id',
        'appointment_id',
        'invoice_number',
        'subtotal_rwf',
        'discount_rwf',
        'insurance_covered_rwf',
        'total_amount_rwf',
        'amount_paid_rwf',
        'balance_rwf',
        'due_date',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date',
        'subtotal_rwf' => 'decimal:2',
        'discount_rwf' => 'decimal:2',
        'insurance_covered_rwf' => 'decimal:2',
        'total_amount_rwf' => 'decimal:2',
        'amount_paid_rwf' => 'decimal:2',
        'balance_rwf' => 'decimal:2',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function insuranceClaim()
    {
        return $this->hasOne(InsuranceClaim::class);
    }

    /**
     * Generate a unique sequential invoice number (e.g. INV-202611-00042)
     */
    public static function generateInvoiceNumber(): string
    {
        $prefix = 'INV-' . date('Ym') . '-';
        $nextId = (static::max('id') ?? 0) + 1;
        $candidate = $prefix . str_pad((string) $nextId, 5, '0', STR_PAD_LEFT);

        while (static::where('invoice_number', $candidate)->exists()) {
            $nextId++;
            $candidate = $prefix . str_pad((string) $nextId, 5, '0', STR_PAD_LEFT);
        }

        return $candidate;
    }

    /**
     * Recalculate balance and update status based on amount paid
     */
    public function recalculateBalance(): void
    {
        $this->balance_rwf = max(0, (float) $this->total_amount_rwf - (float) $this->amount_paid_rwf);

        if ($this->balance_rwf <= 0) {
            $this->status = 'paid';
        } elseif ($this->amount_paid_rwf > 0) {
            $this->status = 'partially_paid';
        } else {
            $this->status = ($this->due_date && $this->due_date->isPast()) ? 'overdue' : 'unpaid';
        }

        $this->save();
    }

    public function scopeStatus(Builder $query, ?string $status): Builder
    {
        if ($status && $status !== 'all') {
            return $query->where('status', $status);
        }
        return $query;
    }

    public function scopeUnpaid(Builder $query): Builder
    {
        return $query->whereIn('status', ['unpaid', 'partially_paid', 'overdue']);
    }

    public function scopePaid(Builder $query): Builder
    {
        return $query->where('status', 'paid');
    }

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->where('status', 'overdue')
            ->orWhere(function (Builder $q) {
                $q->whereIn('status', ['unpaid', 'partially_paid'])
                  ->where('due_date', '<', now()->toDateString());
            });
    }

    public function scopeDateRange(Builder $query, ?string $from, ?string $to): Builder
    {
        if ($from) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to) {
            $query->whereDate('created_at', '<=', $to);
        }
        return $query;
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (!$term) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term) {
            $q->where('invoice_number', 'like', "%{$term}%")
              ->orWhereHas('patient.user', function (Builder $userQuery) use ($term) {
                  $userQuery->where('name', 'like', "%{$term}%")
                            ->orWhere('email', 'like', "%{$term}%")
                            ->orWhere('phone', 'like', "%{$term}%");
              });
        });
    }
}
