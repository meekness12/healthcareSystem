<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id',
        'item_description',
        'item_type',
        'reference_id',
        'quantity',
        'unit_price_rwf',
        'total_price_rwf',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price_rwf' => 'decimal:2',
        'total_price_rwf' => 'decimal:2',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function calculateTotalPrice(): float
    {
        $this->total_price_rwf = round((int) $this->quantity * (float) $this->unit_price_rwf, 2);
        return $this->total_price_rwf;
    }

    public function scopeType(Builder $query, ?string $type): Builder
    {
        if ($type && $type !== 'all') {
            return $query->where('item_type', $type);
        }
        return $query;
    }
}
