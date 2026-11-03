<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $fillable = [
        'user_id',
        'patient_number',
        'dob',
        'gender',
        'national_id',
        'address',
        'emergency_contact_name',
        'emergency_contact_phone',
        'insurance_provider_id',
        'insurance_number',
        'allergies',
        'medical_history',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function insuranceProvider()
    {
        return $this->belongsTo(InsuranceProvider::class, 'insurance_provider_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function consultations()
    {
        return $this->hasMany(Consultation::class);
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class);
    }

    public function labTests()
    {
        return $this->hasMany(LabTest::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function insuranceClaims()
    {
        return $this->hasMany(InsuranceClaim::class);
    }

    public function medicalRecordFiles()
    {
        return $this->hasMany(MedicalRecordFile::class);
    }
}
