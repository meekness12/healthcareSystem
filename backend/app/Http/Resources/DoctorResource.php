<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DoctorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $avatarUrl = null;
        if ($this->user?->avatar_url) {
            $avatarUrl = str_starts_with($this->user->avatar_url, 'http')
                ? $this->user->avatar_url
                : asset('storage/' . ltrim($this->user->avatar_url, '/'));
        }

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->user?->name,
            'email' => $this->user?->email,
            'phone' => $this->user?->phone,
            'avatar_url' => $avatarUrl,
            'branch_id' => $this->branch_id,
            'branch_name' => $this->branch?->branch_name,
            'branch_province' => $this->branch?->province,
            'branch_district' => $this->branch?->district,
            'department_id' => $this->department_id,
            'department_name' => $this->department?->department_name,
            'specialty_id' => $this->specialty_id,
            'specialty_name' => $this->specialty?->specialty_name,
            'license_number' => $this->license_number,
            'consultation_room' => $this->consultation_room,
            'consultation_fee' => (float)$this->consultation_fee,
            'max_daily_appointments' => $this->max_daily_appointments,
            'bio' => $this->bio,
            'status' => $this->status,
            'schedules' => $this->whenLoaded('schedules', function () {
                return $this->schedules->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'day_of_week' => $s->day_of_week,
                        'start_time' => substr($s->start_time, 0, 5),
                        'end_time' => substr($s->end_time, 0, 5),
                        'slot_duration_minutes' => $s->slot_duration_minutes,
                        'status' => $s->status,
                    ];
                });
            }),
            'active_days' => $this->relationLoaded('schedules')
                ? $this->schedules->where('status', 'active')->pluck('day_of_week')->values()->toArray()
                : [],
        ];
    }
}
