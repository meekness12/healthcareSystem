<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClaimStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && in_array($this->user()->role, ['admin', 'billing_officer']);
    }

    public function rules(): array
    {
        return [
            'claim_status' => 'required|in:draft,submitted,under_review,approved,rejected,paid',
            'approved_amount_rwf' => 'required_if:claim_status,approved|nullable|numeric|min:0',
            'rejection_reason' => 'required_if:claim_status,rejected|nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'approved_amount_rwf.required_if' => 'The approved amount is required when approving an insurance claim.',
            'rejection_reason.required_if' => 'A rejection reason is required when rejecting an insurance claim.',
        ];
    }
}
