<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BranchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'branch_name' => $this->branch_name,
            'province' => $this->province,
            'district' => $this->district,
            'location' => $this->location,
            'address' => $this->address,
            'contact_phone' => $this->contact_phone,
            'contact_email' => $this->contact_email,
            'status' => $this->status,
            'departments_count' => $this->whenCounted('departments'),
            'doctors_count' => $this->whenCounted('doctors'),
            'departments' => DepartmentResource::collection($this->whenLoaded('departments')),
        ];
    }
}
