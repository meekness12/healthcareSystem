<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InsuranceClaimResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'claim_reference' => $this->claim_reference,
            'patient_id' => $this->patient_id,
            'invoice_id' => $this->invoice_id,
            'provider_id' => $this->provider_id,
            'claimed_amount_rwf' => (float) $this->claimed_amount_rwf,
            'approved_amount_rwf' => (float) $this->approved_amount_rwf,
            'formatted_claimed_amount' => number_format($this->claimed_amount_rwf) . ' RWF',
            'formatted_approved_amount' => number_format($this->approved_amount_rwf) . ' RWF',
            'claim_status' => $this->claim_status,
            'rejection_reason' => $this->rejection_reason,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'formatted_submitted_at' => $this->submitted_at?->format('d M Y, H:i'),
            'processed_at' => $this->processed_at?->toIso8601String(),
            'formatted_processed_at' => $this->processed_at?->format('d M Y, H:i'),
            'provider' => $this->whenLoaded('provider', function () {
                return [
                    'id' => $this->provider->id,
                    'name' => $this->provider->provider_name,
                    'code' => $this->provider->provider_code,
                    'contact_phone' => $this->provider->contact_phone,
                    'contact_email' => $this->provider->contact_email,
                    'coverage_percentage' => (float) $this->provider->coverage_percentage_default,
                ];
            }),
            'patient' => $this->whenLoaded('patient', function () {
                return [
                    'id' => $this->patient->id,
                    'patient_number' => $this->patient->patient_number,
                    'name' => $this->patient->user->name ?? 'Patient',
                    'national_id' => $this->patient->national_id,
                    'insurance_number' => $this->patient->insurance_number,
                ];
            }),
            'invoice' => $this->whenLoaded('invoice', function () {
                return [
                    'id' => $this->invoice->id,
                    'invoice_number' => $this->invoice->invoice_number,
                    'subtotal_rwf' => (float) $this->invoice->subtotal_rwf,
                    'insurance_covered_rwf' => (float) $this->invoice->insurance_covered_rwf,
                    'balance_rwf' => (float) $this->invoice->balance_rwf,
                    'status' => $this->invoice->status,
                ];
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
