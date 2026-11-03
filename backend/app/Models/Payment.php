<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }
}
