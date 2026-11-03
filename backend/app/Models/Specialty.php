<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Specialty extends Model
{
    protected $fillable = [
        'specialty_name',
        'description',
    ];

    public function doctors()
    {
        return $this->hasMany(Doctor::class, 'specialty_id');
    }
}
