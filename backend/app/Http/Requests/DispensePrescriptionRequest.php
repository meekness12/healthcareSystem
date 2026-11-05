<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DispensePrescriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && in_array($this->user()->role, ['pharmacist', 'admin']);
    }

    public function rules(): array
    {
        return [
            'prescription_id' => ['required', 'exists:prescriptions,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.prescription_item_id' => ['required', 'exists:prescription_items,id'],
            'items.*.quantity_dispensed' => ['required', 'integer', 'min:1', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'prescription_id.required' => 'Prescription reference is required for dispensing.',
            'items.required' => 'At least one medication item must be selected for dispensation.',
            'items.*.quantity_dispensed.min' => 'Dispensed quantity must be at least 1 unit.',
        ];
    }
}
