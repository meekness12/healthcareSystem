<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicineDispensation extends Model
{
    protected $fillable = [
        'prescription_id',
        'pharmacist_id',
        'dispensation_reference',
        'dispensed_at',
        'status',
        'notes',
    ];

    protected $casts = [
        'dispensed_at' => 'datetime',
    ];

    public function prescription()
    {
        return $this->belongsTo(Prescription::class);
    }

    public function pharmacist()
    {
        return $this->belongsTo(User::class, 'pharmacist_id');
    }

    public function items()
    {
        return $this->hasMany(DispensationItem::class, 'dispensation_id');
    }
}
