<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLabTestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && in_array($this->user()->role, ['doctor', 'admin']);
    }

    public function rules(): array
    {
        return [
            'appointment_id' => ['required', 'exists:appointments,id'],
            'consultation_id' => ['nullable', 'exists:consultations,id'],
            'patient_id' => ['required', 'exists:patients,id'],
            'test_type_id' => ['required', 'exists:lab_test_types,id'],
            'priority' => ['required', 'in:routine,urgent,emergency'],
        ];
    }

    public function messages(): array
    {
        return [
            'test_type_id.required' => 'Please select a laboratory diagnostic test to order.',
            'test_type_id.exists' => 'The selected diagnostic test is invalid or not in the hospital catalogue.',
            'priority.required' => 'Please specify the diagnostic priority level (Routine, Urgent, or Emergency).',
        ];
    }
}
