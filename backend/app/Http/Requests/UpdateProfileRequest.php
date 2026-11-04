<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'phone' => ['sometimes', 'required', 'string', 'max:25', 'unique:users,phone,' . $userId],
            // Patient-specific fields
            'address' => ['nullable', 'string', 'max:255'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:25'],
            'insurance_provider_id' => ['nullable', 'exists:insurance_providers,id'],
            'insurance_number' => ['nullable', 'string', 'max:50'],
            'allergies' => ['nullable', 'string'],
            'medical_history' => ['nullable', 'string'],
            // Doctor-specific fields
            'consultation_room' => ['nullable', 'string', 'max:50'],
            'consultation_fee' => ['nullable', 'numeric', 'min:0'],
            'bio' => ['nullable', 'string'],
        ];
    }
}
