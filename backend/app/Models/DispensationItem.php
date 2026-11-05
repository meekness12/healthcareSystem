<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DispensationItem extends Model
{
    protected $fillable = [
        'dispensation_id',
        'prescription_item_id',
        'quantity_dispensed',
        'collection_date',
    ];

    protected $casts = [
        'quantity_dispensed' => 'integer',
        'collection_date' => 'date',
    ];

    public function dispensation()
    {
        return $this->belongsTo(MedicineDispensation::class, 'dispensation_id');
    }

    public function prescriptionItem()
    {
        return $this->belongsTo(PrescriptionItem::class, 'prescription_item_id');
    }
}
