<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LabResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'lab_test_id' => $this->lab_test_id,
            'result_summary' => $this->result_summary,
            'result_details' => $this->result_details,
            'reference_ranges' => $this->reference_ranges,
            'report_pdf_path' => $this->report_pdf_path,
            'report_pdf_url' => $this->report_pdf_url,
            'recorded_by' => [
                'id' => $this->recordedBy?->id,
                'name' => $this->recordedBy?->name,
                'role' => $this->recordedBy?->role,
            ],
            'reviewed_by' => $this->reviewedBy ? [
                'id' => $this->reviewedBy->id,
                'name' => $this->reviewedBy->name,
                'role' => $this->reviewedBy->role,
            ] : null,
            'result_date' => $this->result_date ? $this->result_date->toIso8601String() : null,
        ];
    }
}
