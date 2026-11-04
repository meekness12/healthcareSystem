<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DoctorScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user && in_array($user->role, ['doctor', 'admin']);
    }

    public function rules(): array
    {
        return [
            'doctor_id' => ['sometimes', 'exists:doctors,id'],
            'status' => ['sometimes', 'in:active,on_leave,inactive'],
            'schedules' => ['required', 'array', 'min:1'],
            'schedules.*.day_of_week' => [
                'required',
                'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            ],
            'schedules.*.start_time' => ['required', 'string'],
            'schedules.*.end_time' => ['required', 'string'],
            'schedules.*.slot_duration_minutes' => ['sometimes', 'integer', 'in:15,20,30,45,60'],
            'schedules.*.status' => ['sometimes', 'in:active,inactive'],
        ];
    }
}
