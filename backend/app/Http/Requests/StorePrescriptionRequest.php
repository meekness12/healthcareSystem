<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePrescriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && in_array($this->user()->role, ['doctor', 'admin']);
    }

    public function rules(): array
    {
        return [
            'consultation_id' => ['required', 'exists:consultations,id'],
            'instructions' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.medicine_id' => ['required', 'exists:medicines,id'],
            'items.*.dosage' => ['required', 'string', 'max:100'],
            'items.*.frequency' => ['required', 'string', 'max:100'],
            'items.*.duration_days' => ['required', 'integer', 'min:1', 'max:365'],
            'items.*.quantity_prescribed' => ['required', 'integer', 'min:1', 'max:1000'],
            'items.*.instructions' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'At least one medicine item must be prescribed.',
            'items.min' => 'At least one medicine item must be prescribed.',
            'items.*.medicine_id.exists' => 'The selected medicine is invalid or does not exist in the hospital catalogue.',
        ];
    }
}
