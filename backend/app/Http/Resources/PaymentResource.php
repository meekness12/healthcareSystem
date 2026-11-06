<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'patient_id' => $this->patient_id,
            'transaction_reference' => $this->transaction_reference,
            'amount_rwf' => (float) $this->amount_rwf,
            'formatted_amount' => number_format($this->amount_rwf) . ' RWF',
            'payment_method' => $this->payment_method,
            'payer_phone' => $this->payer_phone,
            'payment_status' => $this->payment_status,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'formatted_paid_at' => $this->paid_at?->format('d M Y, H:i'),
            'patient' => $this->whenLoaded('patient', function () {
                return [
                    'id' => $this->patient->id,
                    'patient_number' => $this->patient->patient_number,
                    'name' => $this->patient->user->name ?? 'Patient',
                    'email' => $this->patient->user->email ?? '',
                    'phone' => $this->patient->user->phone ?? '',
                ];
            }),
            'invoice' => $this->whenLoaded('invoice', function () {
                return [
                    'id' => $this->invoice->id,
                    'invoice_number' => $this->invoice->invoice_number,
                    'total_amount_rwf' => (float) $this->invoice->total_amount_rwf,
                    'amount_paid_rwf' => (float) $this->invoice->amount_paid_rwf,
                    'balance_rwf' => (float) $this->invoice->balance_rwf,
                    'status' => $this->invoice->status,
                ];
            }),
            'receipt_url' => url("/api/payments/{$this->id}/receipt/pdf"),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
