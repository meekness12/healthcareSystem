<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AvatarUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'avatar' => ['required', 'file', 'image', 'mimes:jpeg,jpg,png', 'max:2048'], // max 2MB in KB
        ];
    }

    public function messages(): array
    {
        return [
            'avatar.required' => 'Please select a profile photograph to upload.',
            'avatar.image' => 'The uploaded file must be an image.',
            'avatar.mimes' => 'Profile photographs must be in JPEG or PNG format only.',
            'avatar.max' => 'Profile photographs must not exceed 2MB in size.',
        ];
    }
}
