<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    protected $fillable = [
        'medicine_name',
        'generic_name',
        'category',
        'strength',
        'dosage_form',
        'unit_price_rwf',
        'stock_quantity',
        'reorder_level',
        'status',
    ];

    public function prescriptionItems()
    {
        return $this->hasMany(PrescriptionItem::class);
    }
}
