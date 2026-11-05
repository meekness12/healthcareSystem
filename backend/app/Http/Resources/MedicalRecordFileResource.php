<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MedicalRecordFileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'consultation_id' => $this->consultation_id,
            'file_name' => $this->file_name,
            'file_path' => $this->file_path,
            'file_type' => $this->file_type,
            'file_url' => $this->file_url,
            'uploaded_by' => [
                'id' => $this->uploadedBy?->id,
                'name' => $this->uploadedBy?->name,
                'role' => $this->uploadedBy?->role,
            ],
            'created_at' => $this->created_at ? $this->created_at->toISOString() : null,
        ];
    }
}
