<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'branch_name' => $this->branch?->branch_name,
            'department_name' => $this->department_name,
            'description' => $this->description,
            'status' => $this->status,
            'doctors_count' => $this->whenCounted('doctors'),
            'doctors' => DoctorResource::collection($this->whenLoaded('doctors')),
        ];
    }
}
