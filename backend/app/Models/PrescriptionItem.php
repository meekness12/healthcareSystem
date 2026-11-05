<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrescriptionItem extends Model
{
    protected $fillable = [
        'prescription_id',
        'medicine_id',
        'dosage',
        'frequency',
        'duration_days',
        'quantity_prescribed',
        'quantity_dispensed',
        'instructions',
    ];

    protected $casts = [
        'duration_days' => 'integer',
        'quantity_prescribed' => 'integer',
        'quantity_dispensed' => 'integer',
    ];

    public function prescription()
    {
        return $this->belongsTo(Prescription::class);
    }

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }
}
