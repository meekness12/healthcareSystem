<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $avatarUrl = null;
        if ($this->avatar_url) {
            $avatarUrl = str_starts_with($this->avatar_url, 'http')
                ? $this->avatar_url
                : asset('storage/' . ltrim($this->avatar_url, '/'));
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role,
            'status' => $this->status,
            'avatar_url' => $avatarUrl,
            'created_at' => $this->created_at?->toISOString(),
            // Eager or lazy loaded profiles
            'patient' => $this->whenLoaded('patient', function () {
                return [
                    'id' => $this->patient->id,
                    'patient_number' => $this->patient->patient_number,
                    'dob' => $this->patient->dob,
                    'gender' => $this->patient->gender,
                    'national_id' => $this->patient->national_id,
                    'address' => $this->patient->address,
                    'emergency_contact_name' => $this->patient->emergency_contact_name,
                    'emergency_contact_phone' => $this->patient->emergency_contact_phone,
                    'insurance_provider_id' => $this->patient->insurance_provider_id,
                    'insurance_provider_name' => $this->patient->insuranceProvider?->provider_name,
                    'insurance_number' => $this->patient->insurance_number,
                    'allergies' => $this->patient->allergies,
                    'medical_history' => $this->patient->medical_history,
                ];
            }),
            'doctor' => $this->whenLoaded('doctor', function () {
                return [
                    'id' => $this->doctor->id,
                    'branch_id' => $this->doctor->branch_id,
                    'branch_name' => $this->doctor->branch?->branch_name,
                    'branch' => $this->doctor->branch ? [
                        'id' => $this->doctor->branch->id,
                        'name' => $this->doctor->branch->branch_name,
                        'location' => $this->doctor->branch->location,
                        'is_main' => (bool)$this->doctor->branch->is_main,
                    ] : null,
                    'department_id' => $this->doctor->department_id,
                    'department_name' => $this->doctor->department?->department_name,
                    'department' => $this->doctor->department ? [
                        'id' => $this->doctor->department->id,
                        'name' => $this->doctor->department->department_name,
                    ] : null,
                    'specialty_id' => $this->doctor->specialty_id,
                    'specialty_name' => $this->doctor->specialty?->specialty_name,
                    'specialty' => $this->doctor->specialty ? [
                        'id' => $this->doctor->specialty->id,
                        'name' => $this->doctor->specialty->specialty_name,
                    ] : null,
                    'license_number' => $this->doctor->license_number,
                    'consultation_room' => $this->doctor->consultation_room,
                    'consultation_fee' => (float)$this->doctor->consultation_fee,
                    'max_daily_appointments' => $this->doctor->max_daily_appointments,
                    'bio' => $this->doctor->bio,
                    'status' => $this->doctor->status,
                ];
            }),
        ];
    }
}
