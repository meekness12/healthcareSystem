<?php

namespace App\Models;

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

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
