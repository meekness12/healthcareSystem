<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClaimRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && in_array($this->user()->role, ['admin', 'billing_officer']);
    }

    public function rules(): array
    {
        return [
            'invoice_id' => 'required|exists:invoices,id',
            'provider_id' => 'required|exists:insurance_providers,id',
            'claimed_amount_rwf' => 'required|numeric|min:1',
        ];
    }
}
