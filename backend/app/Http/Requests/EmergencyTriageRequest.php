<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EmergencyTriageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'exists:hospital_branches,id'],
            'patient_id' => ['sometimes', 'nullable', 'exists:patients,id'],
            'walk_in_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'walk_in_phone' => ['sometimes', 'nullable', 'string', 'max:25'],
            'triage_level' => [
                'required',
                'in:level_1_resuscitation,level_2_emergency,level_3_urgent',
            ],
            'symptoms' => ['required', 'string', 'max:1000'],
            'vital_signs' => ['nullable', 'array'],
            'vital_signs.blood_pressure' => ['nullable', 'string', 'max:20'],
            'vital_signs.heart_rate' => ['nullable', 'integer', 'min:30', 'max:250'],
            'vital_signs.temperature' => ['nullable', 'numeric', 'min:30', 'max:45'],
            'vital_signs.spo2' => ['nullable', 'integer', 'min:50', 'max:100'],
        ];
    }
}
