<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HospitalBranch extends Model
{
    protected $fillable = [
        'branch_name',
        'province',
        'district',
        'location',
        'address',
        'contact_phone',
        'contact_email',
        'status',
    ];

    public function departments()
    {
        return $this->hasMany(Department::class, 'branch_id');
    }

    public function doctors()
    {
        return $this->hasMany(Doctor::class, 'branch_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'branch_id');
    }
}
