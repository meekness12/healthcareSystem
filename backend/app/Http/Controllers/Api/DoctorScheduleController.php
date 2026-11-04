<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DoctorScheduleRequest;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\DoctorSchedule;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DoctorScheduleController extends Controller
{
    /**
     * Display a doctor's active weekly consulting schedule.
     */
    public function show($doctorId): JsonResponse
    {
        $doctor = Doctor::with(['user', 'branch', 'schedules' => function ($q) {
            $q->where('status', 'active')->orderByRaw("FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')");
        }])->findOrFail($doctorId);

        return response()->json([
            'success' => true,
            'doctor_id' => $doctor->id,
            'doctor_name' => $doctor->user?->name,
            'status' => $doctor->status,
            'schedules' => $doctor->schedules->map(function ($s) {
                return [
                    'id' => $s->id,
                    'day_of_week' => $s->day_of_week,
                    'start_time' => substr($s->start_time, 0, 5),
                    'end_time' => substr($s->end_time, 0, 5),
                    'slot_duration_minutes' => $s->slot_duration_minutes,
                    'status' => $s->status,
                ];
            }),
        ]);
    }

    /**
     * Update doctor's weekly consulting schedule and availability status.
     * Doctor can update own schedule; Admin can update any doctor's schedule.
     */
    public function updateMySchedule(DoctorScheduleRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $doctorId = ($user->role === 'admin' && isset($validated['doctor_id']))
            ? $validated['doctor_id']
            : $user->doctor?->id;

        if (!$doctorId) {
            return response()->json([
                'success' => false,
                'message' => 'No associated doctor record found for this account.',
            ], 404);
        }

        $doctor = Doctor::findOrFail($doctorId);

        DB::transaction(function () use ($doctor, $validated) {
            if (isset($validated['status'])) {
                $doctor->status = $validated['status'];
                $doctor->save();
            }

            foreach ($validated['schedules'] as $item) {
                DoctorSchedule::updateOrCreate(
                    [
                        'doctor_id' => $doctor->id,
                        'day_of_week' => strtolower($item['day_of_week']),
                    ],
                    [
                        'start_time' => $item['start_time'],
                        'end_time' => $item['end_time'],
                        'slot_duration_minutes' => $item['slot_duration_minutes'] ?? 30,
                        'status' => $item['status'] ?? 'active',
                    ]
                );
            }
        });

        $doctor->load(['schedules']);

        return response()->json([
            'success' => true,
            'message' => 'Doctor consulting schedule updated successfully.',
            'doctor_status' => $doctor->status,
            'schedules' => $doctor->schedules,
        ]);
    }

    /**
     * Dynamic Appointment Slot Generation Engine.
     * Generates discrete availability slots considering:
     * - Day of week schedule
     * - Doctor status (active vs on_leave)
     * - Slot duration (e.g. 30 min)
     * - Existing booked appointments
     * - Max daily appointment limit
     * - Past time slots for current day
     */
    public function availableSlots(Request $request, $doctorId): JsonResponse
    {
        $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        $dateString = $request->query('date');
        $date = Carbon::parse($dateString, 'Africa/Kigali')->startOfDay();
        $today = Carbon::now('Africa/Kigali')->startOfDay();

        if ($date->lt($today)) {
            throw ValidationException::withMessages([
                'date' => ['Appointment date cannot be in the past.'],
            ]);
        }

        $doctor = Doctor::with(['user', 'branch'])->findOrFail($doctorId);

        // 1. Check if doctor is on leave
        if ($doctor->status === 'on_leave') {
            return response()->json([
                'success' => true,
                'doctor_id' => $doctor->id,
                'doctor_name' => $doctor->user?->name,
                'branch_name' => $doctor->branch?->branch_name,
                'date' => $dateString,
                'day_of_week' => strtolower($date->format('l')),
                'is_working_day' => false,
                'is_on_leave' => true,
                'message' => 'Doctor is currently on clinical leave. Please select another doctor or date.',
                'slots' => [],
            ]);
        }

        // 2. Identify Day of Week
        $dayOfWeek = strtolower($date->format('l')); // e.g. monday, tuesday

        // 3. Find Doctor's active schedule for this day
        $schedule = DoctorSchedule::where('doctor_id', $doctor->id)
            ->where('day_of_week', $dayOfWeek)
            ->where('status', 'active')
            ->first();

        if (!$schedule) {
            return response()->json([
                'success' => true,
                'doctor_id' => $doctor->id,
                'doctor_name' => $doctor->user?->name,
                'branch_name' => $doctor->branch?->branch_name,
                'date' => $dateString,
                'day_of_week' => $dayOfWeek,
                'is_working_day' => false,
                'is_on_leave' => false,
                'message' => "Doctor does not conduct outpatient consultations on {$dayOfWeek}s.",
                'slots' => [],
            ]);
        }

        // 4. Fetch already booked appointments for this date
        $bookedAppointments = Appointment::where('doctor_id', $doctor->id)
            ->where('appointment_date', $dateString)
            ->whereNotIn('status', ['cancelled'])
            ->get();

        $bookedTimes = $bookedAppointments->map(function ($app) {
            return substr($app->start_time, 0, 5);
        })->toArray();

        $dailyBookedCount = $bookedAppointments->count();
        $maxDailyLimitReached = $dailyBookedCount >= $doctor->max_daily_appointments;

        // 5. Generate discrete time slots
        $slots = [];
        $slotMinutes = $schedule->slot_duration_minutes ?: 30;

        $currentTime = Carbon::parse("{$dateString} {$schedule->start_time}", 'Africa/Kigali');
        $endTime = Carbon::parse("{$dateString} {$schedule->end_time}", 'Africa/Kigali');
        $now = Carbon::now('Africa/Kigali');

        while ($currentTime->lt($endTime)) {
            $slotStart = $currentTime->format('H:i');
            $slotEnd = $currentTime->copy()->addMinutes($slotMinutes)->format('H:i');

            $isBooked = in_array($slotStart, $bookedTimes);
            $isPast = $date->isToday() && $currentTime->lt($now);

            $isAvailable = true;
            $reason = null;

            if ($isBooked) {
                $isAvailable = false;
                $reason = 'Already booked';
            } elseif ($isPast) {
                $isAvailable = false;
                $reason = 'Time slot has passed';
            } elseif ($maxDailyLimitReached) {
                $isAvailable = false;
                $reason = 'Doctor has reached maximum patient consultation capacity for this date';
            }

            $slots[] = [
                'start_time' => $slotStart,
                'end_time' => $slotEnd,
                'is_available' => $isAvailable,
                'is_booked' => $isBooked,
                'is_past' => $isPast,
                'reason' => $reason,
            ];

            $currentTime->addMinutes($slotMinutes);
        }

        $availableCount = count(array_filter($slots, fn($s) => $s['is_available']));

        return response()->json([
            'success' => true,
            'doctor_id' => $doctor->id,
            'doctor_name' => $doctor->user?->name,
            'branch_name' => $doctor->branch?->branch_name,
            'date' => $dateString,
            'day_of_week' => $dayOfWeek,
            'is_working_day' => true,
            'is_on_leave' => false,
            'consultation_fee' => (float)$doctor->consultation_fee,
            'slot_duration_minutes' => $slotMinutes,
            'max_daily_appointments' => $doctor->max_daily_appointments,
            'daily_booked_count' => $dailyBookedCount,
            'total_slots' => count($slots),
            'available_slots_count' => $availableCount,
            'slots' => $slots,
        ]);
    }
}
