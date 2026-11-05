<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $doctorAvatar = null;
        if ($this->doctor?->user?->avatar_url) {
            $doctorAvatar = str_starts_with($this->doctor->user->avatar_url, 'http')
                ? $this->doctor->user->avatar_url
                : asset('storage/' . ltrim($this->doctor->user->avatar_url, '/'));
        }

        return [
            'id' => $this->id,
            'booking_reference' => $this->booking_reference,
            'appointment_date' => $this->appointment_date ? $this->appointment_date->format('Y-m-d') : null,
            'start_time' => substr($this->start_time, 0, 5),
            'end_time' => substr($this->end_time, 0, 5),
            'appointment_type' => $this->appointment_type,
            'is_emergency' => (bool)$this->is_emergency,
            'status' => $this->status,
            'reason' => $this->reason,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            // Financial & Insurance Co-Pay Breakdown
            'financial' => $this->calculateInsuranceCoverage(),
            // Linked Patient Profile
            'patient' => [
                'id' => $this->patient?->id,
                'patient_number' => $this->patient?->patient_number,
                'name' => $this->patient?->user?->name,
                'email' => $this->patient?->user?->email,
                'phone' => $this->patient?->user?->phone,
                'national_id' => $this->patient?->national_id,
                'gender' => $this->patient?->gender,
                'dob' => $this->patient?->dob,
                'allergies' => $this->patient?->allergies,
            ],
            // Linked Doctor Profile
            'doctor' => [
                'id' => $this->doctor?->id,
                'name' => $this->doctor?->user?->name,
                'phone' => $this->doctor?->user?->phone,
                'avatar_url' => $doctorAvatar,
                'license_number' => $this->doctor?->license_number,
                'specialty_name' => $this->doctor?->specialty?->specialty_name,
                'department_name' => $this->doctor?->department?->department_name,
                'consultation_room' => $this->doctor?->consultation_room,
                'consultation_fee' => (float)($this->doctor?->consultation_fee ?? 0),
            ],
            // Linked Hospital Branch
            'branch' => [
                'id' => $this->branch?->id,
                'branch_name' => $this->branch?->branch_name,
                'province' => $this->branch?->province,
                'district' => $this->branch?->district,
                'location' => $this->branch?->location,
                'address' => $this->branch?->address,
                'contact_phone' => $this->branch?->contact_phone,
            ],
        ];
    }
}
