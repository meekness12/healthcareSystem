<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = [
        'patient_id',
        'doctor_id',
        'branch_id',
        'booking_reference',
        'appointment_date',
        'start_time',
        'end_time',
        'appointment_type',
        'is_emergency',
        'status',
        'reason',
        'notes',
    ];

    protected $casts = [
        'is_emergency' => 'boolean',
        'appointment_date' => 'date',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function branch()
    {
        return $this->belongsTo(HospitalBranch::class, 'branch_id');
    }

    public function consultation()
    {
        return $this->hasOne(Consultation::class);
    }

    public function labTests()
    {
        return $this->hasMany(LabTest::class);
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }
}
