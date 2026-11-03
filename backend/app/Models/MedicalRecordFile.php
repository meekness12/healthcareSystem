<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicalRecordFile extends Model
{
    protected $fillable = [
        'patient_id',
        'consultation_id',
        'file_name',
        'file_path',
        'file_type',
        'uploaded_by',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
