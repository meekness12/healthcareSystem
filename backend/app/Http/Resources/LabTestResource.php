<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LabTestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'appointment_id' => $this->appointment_id,
            'consultation_id' => $this->consultation_id,
            'priority' => $this->priority,
            'status' => $this->status,
            'request_date' => $this->request_date ? $this->request_date->toIso8601String() : null,
            'test_type' => [
                'id' => $this->testType?->id,
                'test_name' => $this->testType?->test_name,
                'category' => $this->testType?->category,
                'description' => $this->testType?->description,
                'price_rwf' => (float) ($this->testType?->price_rwf ?? 0),
                'turnaround_hours' => (int) ($this->testType?->turnaround_hours ?? 24),
            ],
            'patient' => [
                'id' => $this->patient?->id,
                'name' => $this->patient?->user?->name,
                'patient_number' => $this->patient?->patient_number,
                'gender' => $this->patient?->gender,
                'dob' => $this->patient?->dob,
                'phone' => $this->patient?->user?->phone,
                'insurance_provider' => $this->patient?->insuranceProvider?->provider_name,
                'insurance_number' => $this->patient?->insurance_number,
                'coverage_percentage' => (float) ($this->patient?->insuranceProvider?->coverage_percentage ?? 0),
            ],
            'requested_by' => [
                'id' => $this->requestedBy?->id,
                'name' => $this->requestedBy?->name,
                'role' => $this->requestedBy?->role,
            ],
            'assigned_to' => $this->assignedTo ? [
                'id' => $this->assignedTo->id,
                'name' => $this->assignedTo->name,
                'role' => $this->assignedTo->role,
            ] : null,
            'result' => $this->result ? new LabResultResource($this->result) : null,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
        ];
    }
}
