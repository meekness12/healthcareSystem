<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DispensationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'dispensation_reference' => $this->dispensation_reference,
            'dispensed_at' => $this->dispensed_at ? $this->dispensed_at->toIso8601String() : null,
            'status' => $this->status,
            'notes' => $this->notes,
            'prescription_id' => $this->prescription_id,
            'prescription_number' => $this->prescription?->prescription_number,
            'prescription_status' => $this->prescription?->status,
            'pharmacist' => [
                'id' => $this->pharmacist?->id,
                'name' => $this->pharmacist?->name,
                'email' => $this->pharmacist?->email,
            ],
            'patient' => [
                'id' => $this->prescription?->patient?->id,
                'name' => $this->prescription?->patient?->user?->name,
                'patient_number' => $this->prescription?->patient?->patient_number,
                'insurance' => $this->prescription?->patient?->insuranceProvider?->provider_name,
            ],
            'items' => $this->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'prescription_item_id' => $item->prescription_item_id,
                    'medicine_name' => $item->prescriptionItem?->medicine?->medicine_name ?? 'Medicine',
                    'dosage' => $item->prescriptionItem?->dosage,
                    'quantity_dispensed' => (int) $item->quantity_dispensed,
                    'collection_date' => $item->collection_date ? $item->collection_date->format('Y-m-d') : null,
                ];
            }),
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
        ];
    }
}
