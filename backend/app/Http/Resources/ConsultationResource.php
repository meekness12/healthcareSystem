<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConsultationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'appointment_id' => $this->appointment_id,
            'symptoms' => $this->symptoms,
            'diagnosis' => $this->diagnosis,
            'consultation_notes' => $this->consultation_notes,
            'treatment_plan' => $this->treatment_plan,
            'vitals' => $this->vitals ?? [
                'heart_rate' => null,
                'blood_pressure_systolic' => null,
                'blood_pressure_diastolic' => null,
                'temperature' => null,
                'spo2' => null,
                'weight_kg' => null,
            ],
            'follow_up_date' => $this->follow_up_date ? $this->follow_up_date->format('Y-m-d') : null,
            'created_at' => $this->created_at ? $this->created_at->toISOString() : null,
            'doctor' => [
                'id' => $this->doctor?->id,
                'name' => $this->doctor?->user?->name,
                'email' => $this->doctor?->user?->email,
                'license_number' => $this->doctor?->license_number,
                'consultation_room' => $this->doctor?->consultation_room,
                'specialty' => $this->doctor?->specialty?->specialty_name,
                'branch_name' => $this->doctor?->branch?->branch_name,
            ],
            'patient' => [
                'id' => $this->patient?->id,
                'name' => $this->patient?->user?->name,
                'patient_number' => $this->patient?->patient_number,
                'gender' => $this->patient?->gender,
                'dob' => $this->patient?->dob,
                'phone' => $this->patient?->user?->phone,
                'allergies' => $this->patient?->allergies,
                'medical_history' => $this->patient?->medical_history,
                'insurance_provider' => $this->patient?->insuranceProvider?->provider_name,
                'insurance_number' => $this->patient?->insurance_number,
                'coverage_percentage' => (float) ($this->patient?->insuranceProvider?->coverage_percentage ?? 0),
            ],
            'appointment' => [
                'id' => $this->appointment?->id,
                'booking_reference' => $this->appointment?->booking_reference,
                'appointment_date' => $this->appointment?->appointment_date ? $this->appointment->appointment_date->format('Y-m-d') : null,
                'start_time' => $this->appointment?->start_time,
                'end_time' => $this->appointment?->end_time,
                'appointment_type' => $this->appointment?->appointment_type,
                'is_emergency' => (bool) $this->appointment?->is_emergency,
                'status' => $this->appointment?->status,
                'branch_name' => $this->appointment?->branch?->branch_name,
            ],
            'prescriptions' => PrescriptionResource::collection($this->whenLoaded('prescriptions')),
            'medical_record_files' => $this->whenLoaded('medicalRecordFiles'),
        ];
    }
}
