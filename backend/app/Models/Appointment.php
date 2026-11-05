<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = [
        'patient_id',
        'doctor_id',
        'branch_id',
        'booking_reference',
        'appointment_date',
        'start_time',
        'end_time',
        'appointment_type',
        'is_emergency',
        'status',
        'reason',
        'notes',
    ];

    protected $casts = [
        'is_emergency' => 'boolean',
        'appointment_date' => 'date',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function branch()
    {
        return $this->belongsTo(HospitalBranch::class, 'branch_id');
    }

    public function consultation()
    {
        return $this->hasOne(Consultation::class);
    }

    public function labTests()
    {
        return $this->hasMany(LabTest::class);
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    /**
     * Scope to exclude cancelled appointments.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNotIn('status', ['cancelled']);
    }

    /**
     * Scope for appointments scheduled today or in the future.
     */
    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('appointment_date', '>=', now()->toDateString());
    }

    /**
     * Compute Rwandan health insurance coverage breakdown and patient co-pay.
     */
    public function calculateInsuranceCoverage(): array
    {
        $fee = (float)($this->doctor?->consultation_fee ?? 0);
        $patient = $this->patient;
        $insurance = $patient?->insuranceProvider;

        if ($insurance && $insurance->status === 'active') {
            $percentage = (float)$insurance->coverage_percentage_default;
            $covered = round($fee * ($percentage / 100), 2);
            $copay = max(0, round($fee - $covered, 2));

            return [
                'has_insurance' => true,
                'provider_name' => $insurance->provider_name,
                'provider_code' => $insurance->provider_code,
                'insurance_number' => $patient->insurance_number,
                'coverage_percentage' => $percentage,
                'consultation_fee' => $fee,
                'insurance_covered_amount' => $covered,
                'patient_copay_amount' => $copay,
            ];
        }

        return [
            'has_insurance' => false,
            'provider_name' => 'Self-Pay / Private',
            'provider_code' => 'SELF_PAY',
            'insurance_number' => null,
            'coverage_percentage' => 0.0,
            'consultation_fee' => $fee,
            'insurance_covered_amount' => 0.0,
            'patient_copay_amount' => $fee,
        ];
    }

    /**
     * Generate standard sequential booking voucher reference (e.g. BK-2026-00001).
     */
    public static function generateBookingReference(): string
    {
        $year = date('Y');
        $count = static::whereYear('created_at', $year)->count() + 1;
        return sprintf('BK-%s-%05d', $year, $count);
    }
}
