<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecordLabResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && in_array($this->user()->role, ['lab_technician', 'admin']);
    }

    public function rules(): array
    {
        return [
            'result_summary' => ['required', 'string', 'min:3', 'max:5000'],
            'result_details' => ['nullable', 'array'],
            'reference_ranges' => ['nullable', 'string', 'max:1000'],
            'report_pdf' => ['nullable', 'file', 'mimes:pdf', 'max:5120'], // Max 5MB
        ];
    }

    public function messages(): array
    {
        return [
            'result_summary.required' => 'A diagnostic result summary or observation finding is required.',
            'report_pdf.mimes' => 'Laboratory test reports must be in PDF format.',
            'report_pdf.max' => 'The uploaded laboratory PDF report must not exceed 5MB.',
        ];
    }
}
