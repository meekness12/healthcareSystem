<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'patient_id' => $this->patient_id,
            'appointment_id' => $this->appointment_id,
            'patient' => $this->whenLoaded('patient', function () {
                return [
                    'id' => $this->patient->id,
                    'patient_number' => $this->patient->patient_number,
                    'name' => $this->patient->user->name ?? 'Unknown',
                    'email' => $this->patient->user->email ?? '',
                    'phone' => $this->patient->user->phone ?? '',
                    'insurance_provider' => $this->patient->insuranceProvider ? [
                        'id' => $this->patient->insuranceProvider->id,
                        'name' => $this->patient->insuranceProvider->provider_name,
                        'code' => $this->patient->insuranceProvider->provider_code,
                        'coverage_percentage' => (float) $this->patient->insuranceProvider->coverage_percentage_default,
                    ] : null,
                    'insurance_number' => $this->patient->insurance_number,
                ];
            }),
            'appointment' => $this->whenLoaded('appointment', function () {
                return [
                    'id' => $this->appointment->id,
                    'booking_reference' => $this->appointment->booking_reference,
                    'appointment_date' => $this->appointment->appointment_date?->format('Y-m-d'),
                    'doctor_name' => $this->appointment->doctor?->user?->name ?? 'Specialist',
                    'branch_name' => $this->appointment->branch?->branch_name ?? 'Main Branch',
                ];
            }),
            'subtotal_rwf' => (float) $this->subtotal_rwf,
            'discount_rwf' => (float) $this->discount_rwf,
            'insurance_covered_rwf' => (float) $this->insurance_covered_rwf,
            'total_amount_rwf' => (float) $this->total_amount_rwf,
            'amount_paid_rwf' => (float) $this->amount_paid_rwf,
            'balance_rwf' => (float) $this->balance_rwf,
            'formatted_subtotal' => number_format($this->subtotal_rwf) . ' RWF',
            'formatted_insurance_covered' => number_format($this->insurance_covered_rwf) . ' RWF',
            'formatted_total_amount' => number_format($this->total_amount_rwf) . ' RWF',
            'formatted_amount_paid' => number_format($this->amount_paid_rwf) . ' RWF',
            'formatted_balance' => number_format($this->balance_rwf) . ' RWF',
            'due_date' => $this->due_date?->format('Y-m-d'),
            'status' => $this->status,
            'items' => InvoiceItemResource::collection($this->whenLoaded('items')),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'insurance_claim' => $this->whenLoaded('insuranceClaim', function () {
                if (!$this->insuranceClaim) {
                    return null;
                }
                return [
                    'id' => $this->insuranceClaim->id,
                    'claim_reference' => $this->insuranceClaim->claim_reference,
                    'claimed_amount_rwf' => (float) $this->insuranceClaim->claimed_amount_rwf,
                    'approved_amount_rwf' => (float) $this->insuranceClaim->approved_amount_rwf,
                    'claim_status' => $this->insuranceClaim->claim_status,
                    'provider_name' => $this->insuranceClaim->provider->provider_name ?? 'Insurance Provider',
                    'submitted_at' => $this->insuranceClaim->submitted_at?->toIso8601String(),
                ];
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
