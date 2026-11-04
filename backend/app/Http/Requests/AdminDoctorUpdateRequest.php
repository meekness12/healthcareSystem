<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminDoctorUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['sometimes', 'exists:hospital_branches,id'],
            'department_id' => ['sometimes', 'exists:departments,id'],
            'specialty_id' => ['sometimes', 'exists:specialties,id'],
            'license_number' => ['sometimes', 'string', 'max:50'],
            'consultation_room' => ['sometimes', 'string', 'max:50'],
            'consultation_fee' => ['sometimes', 'numeric', 'min:0'],
            'max_daily_appointments' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'status' => ['sometimes', 'in:active,on_leave,inactive'],
            'bio' => ['nullable', 'string'],
        ];
    }
}
