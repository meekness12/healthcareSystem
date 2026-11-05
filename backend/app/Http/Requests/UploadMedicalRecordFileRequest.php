<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadMedicalRecordFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'], // Max 5MB
            'file_name' => ['nullable', 'string', 'max:255'],
            'consultation_id' => ['nullable', 'exists:consultations,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Please select a medical document or report to upload.',
            'file.mimes' => 'Only PDF, JPEG, and PNG medical documents and diagnostic scans are accepted.',
            'file.max' => 'Medical documents must not exceed 5MB in file size.',
        ];
    }
}
