<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
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
        $userId = $this->route('id') ?? $this->route('user');

        return [
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'phone' => ['nullable', 'string', 'regex:/^(\+?250|0)7[2389]\d{7}$/', Rule::unique('users', 'phone')->ignore($userId)],
            'role' => 'sometimes|required|in:patient,doctor,lab_technician,pharmacist,billing_officer,admin',
            'status' => 'sometimes|required|in:active,inactive,suspended',
            'password' => 'nullable|string|min:8',

            // Doctor updates
            'branch_id' => 'nullable|exists:hospital_branches,id',
            'department_id' => 'nullable|exists:departments,id',
            'specialty_id' => 'nullable|exists:specialties,id',
            'consultation_fee' => 'nullable|numeric|min:0',
            'consultation_room' => 'nullable|string|max:100',
            'license_number' => 'nullable|string|max:100',
            'max_daily_appointments' => 'nullable|integer|min:1|max:100',
        ];
    }
}
