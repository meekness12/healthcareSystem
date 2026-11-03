<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Doctor extends Model
{
    protected $fillable = [
        'user_id',
        'branch_id',
        'department_id',
        'specialty_id',
        'license_number',
        'consultation_room',
        'consultation_fee',
        'max_daily_appointments',
        'bio',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(HospitalBranch::class, 'branch_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function specialty()
    {
        return $this->belongsTo(Specialty::class, 'specialty_id');
    }

    public function schedules()
    {
        return $this->hasMany(DoctorSchedule::class);
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
}
