<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    protected $fillable = [
        'consultation_id',
        'doctor_id',
        'patient_id',
        'prescription_number',
        'prescription_date',
        'instructions',
        'status',
    ];

    protected $casts = [
        'prescription_date' => 'date',
    ];

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function items()
    {
        return $this->hasMany(PrescriptionItem::class);
    }

    public function dispensations()
    {
        return $this->hasMany(MedicineDispensation::class);
    }
}
