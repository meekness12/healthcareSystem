<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LabTestType extends Model
{
    protected $fillable = [
        'test_name',
        'category',
        'description',
        'price_rwf',
        'turnaround_hours',
        'status',
    ];

    public function labTests()
    {
        return $this->hasMany(LabTest::class, 'test_type_id');
    }
}
