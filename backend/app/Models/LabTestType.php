<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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

    protected $casts = [
        'price_rwf' => 'decimal:2',
        'turnaround_hours' => 'integer',
    ];

    public function labTests()
    {
        return $this->hasMany(LabTest::class, 'test_type_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeCategory(Builder $query, ?string $category): Builder
    {
        if ($category && $category !== 'All') {
            return $query->where('category', $category);
        }
        return $query;
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (!$term) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term) {
            $q->where('test_name', 'like', "%{$term}%")
              ->orWhere('category', 'like', "%{$term}%")
              ->orWhere('description', 'like', "%{$term}%");
        });
    }
}
