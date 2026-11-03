<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InsuranceProvider extends Model
{
    protected $fillable = [
        'provider_name',
        'provider_code',
        'contact_person',
        'contact_phone',
        'contact_email',
        'coverage_percentage_default',
        'status',
    ];

    public function patients()
    {
        return $this->hasMany(Patient::class, 'insurance_provider_id');
    }

    public function claims()
    {
        return $this->hasMany(InsuranceClaim::class, 'provider_id');
    }
}
