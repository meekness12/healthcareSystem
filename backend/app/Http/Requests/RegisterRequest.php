<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:100', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:25', 'regex:/^(\+?250|0)7[2389]\d{7}$/', 'unique:users,phone'],
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/[A-Z]/',      // at least one uppercase letter
                'regex:/[0-9]/',      // at least one number
                'regex:/[@$!%*?&#]/', // at least one special character
            ],
            // Patient demographic & health insurance details
            'dob' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'in:male,female,other'],
            'national_id' => ['nullable', 'string', 'regex:/^1\d{15}$/'],
            'address' => ['required', 'string', 'max:255'],
            'emergency_contact_name' => ['required', 'string', 'max:100'],
            'emergency_contact_phone' => ['required', 'string', 'max:25'],
            'insurance_provider_id' => ['nullable', 'exists:insurance_providers,id'],
            'insurance_number' => ['nullable', 'string', 'max:50'],
            'allergies' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Phone number must be a valid Rwandan mobile number (e.g. +250788123456 or 0788123456).',
            'password.regex' => 'Password must contain at least one uppercase letter, one number, and one special character (@$!%*?&#).',
            'national_id.regex' => 'Rwandan National ID must be a 16-digit number starting with 1.',
            'dob.before' => 'Date of birth must be a date in the past.',
            'insurance_provider_id.exists' => 'The selected insurance provider does not exist.',
        ];
    }
}
