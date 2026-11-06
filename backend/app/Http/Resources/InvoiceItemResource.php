<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'item_description' => $this->item_description,
            'item_type' => $this->item_type,
            'reference_id' => $this->reference_id,
            'quantity' => (int) $this->quantity,
            'unit_price_rwf' => (float) $this->unit_price_rwf,
            'total_price_rwf' => (float) $this->total_price_rwf,
            'formatted_unit_price' => number_format($this->unit_price_rwf) . ' RWF',
            'formatted_total_price' => number_format($this->total_price_rwf) . ' RWF',
        ];
    }
}
