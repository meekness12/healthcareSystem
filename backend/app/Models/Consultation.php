<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consultation extends Model
{
    protected $fillable = [
        'appointment_id',
        'doctor_id',
        'patient_id',
        'symptoms',
        'diagnosis',
        'consultation_notes',
        'treatment_plan',
        'follow_up_date',
    ];

    protected $casts = [
        'follow_up_date' => 'date',
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class);
    }

    public function labTests()
    {
        return $this->hasMany(LabTest::class);
    }
}
