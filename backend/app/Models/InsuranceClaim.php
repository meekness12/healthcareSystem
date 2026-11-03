<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
