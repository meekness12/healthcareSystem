<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $fillable = [
        'branch_id',
        'department_name',
        'description',
        'status',
    ];

    public function branch()
    {
        return $this->belongsTo(HospitalBranch::class, 'branch_id');
    }

    public function doctors()
    {
        return $this->hasMany(Doctor::class, 'department_id');
    }
}
