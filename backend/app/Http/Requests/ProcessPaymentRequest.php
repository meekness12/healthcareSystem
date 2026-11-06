<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProcessPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('payer_phone') && is_string($this->payer_phone)) {
            // Strip any spaces, hyphens, or brackets from phone number
            $clean = preg_replace('/[\s\-\(\)]/', '', $this->payer_phone);
            $this->merge([
                'payer_phone' => $clean,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'invoice_id' => 'required|exists:invoices,id',
            'amount_rwf' => 'required|numeric|min:100',
            'payment_method' => 'required|in:momo,airtel_money,card,cash',
            'payer_phone' => [
                'nullable',
                'required_if:payment_method,momo,airtel_money',
                'regex:/^(\+?250|0)7[2389]\d{7}$/',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'payer_phone.required_if' => 'Phone number is required for Mobile Money payments.',
            'payer_phone.regex' => 'Please provide a valid Rwandan mobile number (e.g., +250 788 123 456 or 0788123456).',
            'amount_rwf.min' => 'The minimum payable amount is 100 RWF.',
        ];
    }
}
