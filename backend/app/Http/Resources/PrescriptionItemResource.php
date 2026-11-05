<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrescriptionItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $unitPrice = (float) ($this->medicine?->unit_price_rwf ?? 0);
        $totalPrice = $unitPrice * (int) $this->quantity_prescribed;

        return [
            'id' => $this->id,
            'medicine_id' => $this->medicine_id,
            'medicine_name' => $this->medicine?->medicine_name ?? 'Unknown Medicine',
            'generic_name' => $this->medicine?->generic_name,
            'category' => $this->medicine?->category,
            'dosage_form' => $this->medicine?->dosage_form,
            'strength' => $this->medicine?->strength,
            'unit_price_rwf' => $unitPrice,
            'dosage' => $this->dosage,
            'frequency' => $this->frequency,
            'duration_days' => (int) $this->duration_days,
            'quantity_prescribed' => (int) $this->quantity_prescribed,
            'quantity_dispensed' => (int) $this->quantity_dispensed,
            'instructions' => $this->instructions,
            'total_price_rwf' => $totalPrice,
        ];
    }
}
