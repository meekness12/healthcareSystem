<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BookAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'doctor_id' => ['required', 'exists:doctors,id'],
            'branch_id' => ['sometimes', 'exists:hospital_branches,id'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'start_time' => ['required', 'string'],
            'appointment_type' => ['sometimes', 'in:general,specialist,follow_up,emergency'],
            'is_emergency' => ['sometimes', 'boolean'],
            'reason' => ['required', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'appointment_date.after_or_equal' => 'Appointment date must be today or a future date.',
            'doctor_id.exists' => 'The selected doctor was not found in the hospital registry.',
            'reason.required' => 'Please provide the primary reason or symptoms for the consultation.',
        ];
    }
}
