<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LabTest extends Model
{
    protected $fillable = [
        'appointment_id',
        'consultation_id',
        'patient_id',
        'test_type_id',
        'requested_by',
        'assigned_to',
        'priority',
        'request_date',
        'status',
    ];

    protected $casts = [
        'request_date' => 'datetime',
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function testType()
    {
        return $this->belongsTo(LabTestType::class, 'test_type_id');
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function result()
    {
        return $this->hasOne(LabResult::class);
    }
}
