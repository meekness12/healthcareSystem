<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LabResult extends Model
{
    protected $fillable = [
        'lab_test_id',
        'result_summary',
        'result_details',
        'reference_ranges',
        'report_pdf_path',
        'recorded_by',
        'reviewed_by',
        'result_date',
    ];

    protected $casts = [
        'result_details' => 'array',
        'result_date' => 'datetime',
    ];

    public function labTest()
    {
        return $this->belongsTo(LabTest::class);
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
