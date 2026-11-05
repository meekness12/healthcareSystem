<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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

    public static function generateDispensationReference(): string
    {
        $year = date('Y');
        $latest = static::whereYear('created_at', $year)->latest('id')->first();
        $nextNumber = $latest ? ((int) substr($latest->dispensation_reference, -4)) + 1 : 1;
        return sprintf('DISP-%s-%04d', $year, $nextNumber);
    }

    public function scopeForPharmacist(Builder $query, int $pharmacistId): Builder
    {
        return $query->where('pharmacist_id', $pharmacistId);
    }

    public function scopeRecent(Builder $query): Builder
    {
        return $query->orderBy('created_at', 'desc');
    }
}
