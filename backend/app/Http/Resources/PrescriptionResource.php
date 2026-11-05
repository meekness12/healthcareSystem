<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrescriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $items = $this->whenLoaded('items', function () {
            return PrescriptionItemResource::collection($this->items);
        });

        $totalCost = 0;
        if ($this->relationLoaded('items')) {
            foreach ($this->items as $item) {
                $unitPrice = (float) ($item->medicine?->unit_price_rwf ?? 0);
                $totalCost += ($unitPrice * (int) $item->quantity_prescribed);
            }
        }

        return [
            'id' => $this->id,
            'prescription_number' => $this->prescription_number,
            'prescription_date' => $this->prescription_date ? $this->prescription_date->format('Y-m-d') : null,
            'status' => $this->status,
            'instructions' => $this->instructions,
            'consultation_id' => $this->consultation_id,
            'doctor' => [
                'id' => $this->doctor?->id,
                'name' => $this->doctor?->user?->name,
                'email' => $this->doctor?->user?->email,
                'phone' => $this->doctor?->user?->phone,
                'license_number' => $this->doctor?->license_number,
                'specialty' => $this->doctor?->specialty?->specialty_name,
                'consultation_room' => $this->doctor?->consultation_room,
            ],
            'patient' => [
                'id' => $this->patient?->id,
                'name' => $this->patient?->user?->name,
                'patient_number' => $this->patient?->patient_number,
                'gender' => $this->patient?->gender,
                'dob' => $this->patient?->dob,
                'phone' => $this->patient?->user?->phone,
                'insurance_provider' => $this->patient?->insuranceProvider?->provider_name,
                'insurance_number' => $this->patient?->insurance_number,
                'coverage_percentage' => (float) ($this->patient?->insuranceProvider?->coverage_percentage ?? 0),
            ],
            'items' => $items,
            'total_items_count' => $this->items ? $this->items->count() : 0,
            'total_cost_rwf' => $totalCost,
            'created_at' => $this->created_at ? $this->created_at->toISOString() : null,
        ];
    }
}
