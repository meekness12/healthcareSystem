<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],
            'new_password' => [
                'required',
                'string',
                'min:8',
                'different:current_password',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'regex:/[@$!%*?&#]/',
            ],
            'new_password_confirmation' => ['required', 'same:new_password'],
        ];
    }

    public function messages(): array
    {
        return [
            'new_password.different' => 'The new password must be different from your current password.',
            'new_password.regex' => 'The new password must contain at least one uppercase letter, one number, and one special character (@$!%*?&#).',
            'new_password_confirmation.same' => 'The new password confirmation does not match.',
        ];
    }
}
