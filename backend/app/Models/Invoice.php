<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
