<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreConsultationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && in_array($this->user()->role, ['doctor', 'admin']);
    }

    public function rules(): array
    {
        return [
            'appointment_id' => ['required', 'exists:appointments,id'],
            'symptoms' => ['required', 'string', 'min:3', 'max:2000'],
            'diagnosis' => ['required', 'string', 'min:2', 'max:2000'],
            'consultation_notes' => ['nullable', 'string', 'max:5000'],
            'treatment_plan' => ['nullable', 'string', 'max:3000'],
            'follow_up_date' => ['nullable', 'date'],
            'vitals' => ['nullable', 'array'],
            'vitals.heart_rate' => ['nullable', 'integer', 'min:30', 'max:250'],
            'vitals.blood_pressure_systolic' => ['nullable', 'integer', 'min:50', 'max:260'],
            'vitals.blood_pressure_diastolic' => ['nullable', 'integer', 'min:30', 'max:160'],
            'vitals.temperature' => ['nullable', 'numeric', 'min:30.0', 'max:45.0'],
            'vitals.spo2' => ['nullable', 'integer', 'min:50', 'max:100'],
            'vitals.weight_kg' => ['nullable', 'numeric', 'min:1.0', 'max:300.0'],

            // Optional Embedded Prescription
            'prescription' => ['nullable', 'array'],
            'prescription.instructions' => ['nullable', 'string', 'max:1000'],
            'prescription.items' => ['nullable', 'array'],
            'prescription.items.*.medicine_id' => ['required_with:prescription.items', 'exists:medicines,id'],
            'prescription.items.*.dosage' => ['required_with:prescription.items', 'string', 'max:100'],
            'prescription.items.*.frequency' => ['required_with:prescription.items', 'string', 'max:100'],
            'prescription.items.*.duration_days' => ['required_with:prescription.items', 'integer', 'min:1', 'max:365'],
            'prescription.items.*.quantity_prescribed' => ['required_with:prescription.items', 'integer', 'min:1', 'max:1000'],
            'prescription.items.*.instructions' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'appointment_id.required' => 'An appointment reference is required to conduct a clinical encounter.',
            'symptoms.required' => 'Patient presenting symptoms / chief complaints must be recorded.',
            'diagnosis.required' => 'A primary clinical diagnosis is mandatory.',
        ];
    }
}
