<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'admin';
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('phone') && is_string($this->phone)) {
            $this->merge([
                'phone' => preg_replace('/[\s\-\(\)]/', '', $this->phone),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => ['nullable', 'string', 'regex:/^(\+?250|0)7[2389]\d{7}$/', 'unique:users,phone'],
            'role' => 'required|in:patient,doctor,lab_technician,pharmacist,billing_officer,admin',
            'password' => 'required|string|min:8',
            'status' => 'nullable|in:active,inactive,suspended',

            // Doctor specific fields
            'branch_id' => 'required_if:role,doctor|nullable|exists:hospital_branches,id',
            'department_id' => 'required_if:role,doctor|nullable|exists:departments,id',
            'specialty_id' => 'required_if:role,doctor|nullable|exists:specialties,id',
            'consultation_fee' => 'nullable|numeric|min:0',
            'consultation_room' => 'nullable|string|max:100',
            'license_number' => 'nullable|string|max:100',
            'max_daily_appointments' => 'nullable|integer|min:1|max:100',

            // Patient specific fields
            'gender' => 'nullable|in:male,female,other',
            'dob' => 'nullable|date',
            'national_id' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'insurance_provider_id' => 'nullable|exists:insurance_providers,id',
            'insurance_number' => 'nullable|string|max:100',
        ];
    }
}
