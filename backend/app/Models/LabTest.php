<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class LabTest extends Model
{
    protected $fillable = [
        'appointment_id',
        'consultation_id',
        'patient_id',
        'test_type_id',
        'requested_by',
        'assigned_to',
        'priority',
        'request_date',
        'status',
    ];

    protected $casts = [
        'request_date' => 'datetime',
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function testType()
    {
        return $this->belongsTo(LabTestType::class, 'test_type_id');
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function result()
    {
        return $this->hasOne(LabResult::class);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    public function scopeInProgress(Builder $query): Builder
    {
        return $query->whereIn('status', ['assigned', 'in_progress']);
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', 'completed');
    }

    public function scopePriority(Builder $query, ?string $priority): Builder
    {
        if ($priority && $priority !== 'all') {
            return $query->where('priority', $priority);
        }
        return $query;
    }

    public function scopeForPatient(Builder $query, int $patientId): Builder
    {
        return $query->where('patient_id', $patientId);
    }

    public function scopeForTechnician(Builder $query, int $technicianId): Builder
    {
        return $query->where('assigned_to', $technicianId);
    }

    public function scopeRecent(Builder $query): Builder
    {
        return $query->orderBy('created_at', 'desc');
    }
}
