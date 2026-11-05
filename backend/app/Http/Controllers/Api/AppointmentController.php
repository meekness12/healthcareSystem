<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BookAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\DoctorSchedule;
use App\Models\Notification;
use App\Models\Patient;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentController extends Controller
{
    /**
     * Display a listing of appointments with role-based access control.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Appointment::with([
            'patient.user',
            'patient.insuranceProvider',
            'doctor.user',
            'doctor.specialty',
            'doctor.department',
            'branch',
        ]);

        // Role-based tenant isolation
        if ($user->role === 'patient') {
            $patient = $user->patient;
            if (!$patient) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                ]);
            }
            $query->where('patient_id', $patient->id);
        } elseif ($user->role === 'doctor') {
            $doctor = $user->doctor;
            if (!$doctor) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                ]);
            }
            $query->where('doctor_id', $doctor->id);
        } else {
            // Admin, Lab Tech, Pharmacist, Billing
            if ($request->filled('branch_id')) {
                $query->where('branch_id', $request->query('branch_id'));
            }
            if ($request->filled('doctor_id')) {
                $query->where('doctor_id', $request->query('doctor_id'));
            }
            if ($request->filled('patient_id')) {
                $query->where('patient_id', $request->query('patient_id'));
            }
        }

        // Status Filter
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        // Date Filter
        if ($request->filled('date')) {
            $query->where('appointment_date', $request->query('date'));
        } elseif ($request->filled('from_date') && $request->filled('to_date')) {
            $query->whereBetween('appointment_date', [$request->query('from_date'), $request->query('to_date')]);
        }

        // Emergency Filter
        if ($request->has('is_emergency')) {
            $query->where('is_emergency', filter_var($request->query('is_emergency'), FILTER_VALIDATE_BOOLEAN));
        }

        // Search by booking reference or patient/doctor name
        if ($request->filled('search')) {
            $search = '%' . trim($request->query('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('booking_reference', 'like', $search)
                  ->orWhereHas('patient.user', fn($pq) => $pq->where('name', 'like', $search))
                  ->orWhereHas('doctor.user', fn($dq) => $dq->where('name', 'like', $search));
            });
        }

        $appointments = $query->orderBy('appointment_date', 'desc')
            ->orderBy('start_time', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'count' => $appointments->count(),
            'data' => AppointmentResource::collection($appointments),
        ]);
    }

    /**
     * Store a newly created appointment with strict double-booking prevention.
     */
    public function store(BookAppointmentRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // 1. Identify Patient
        if ($user->role === 'patient') {
            $patient = $user->patient;
            if (!$patient) {
                throw ValidationException::withMessages([
                    'patient' => ['Patient profile not found. Please complete profile intake registration.'],
                ]);
            }
        } else {
            // Staff booking on behalf of patient
            $patientId = $request->input('patient_id');
            $patient = $patientId ? Patient::find($patientId) : null;
            if (!$patient) {
                throw ValidationException::withMessages([
                    'patient_id' => ['Patient ID is required when booking as hospital staff.'],
                ]);
            }
        }

        // 2. Identify Doctor & Branch
        $doctor = Doctor::with(['branch', 'schedules'])->findOrFail($validated['doctor_id']);
        $branchId = $validated['branch_id'] ?? $doctor->branch_id;

        if ($doctor->status === 'on_leave') {
            throw ValidationException::withMessages([
                'doctor_id' => ['Dr. ' . ($doctor->user?->name ?? 'selected') . ' is currently on clinical leave.'],
            ]);
        }

        $appointmentDate = $validated['appointment_date'];
        $startTime = substr($validated['start_time'], 0, 5); // Normalized to H:i
        $isEmergency = !empty($validated['is_emergency']);

        // 3. Schedule Validation (unless acute emergency)
        $dayOfWeek = strtolower(Carbon::parse($appointmentDate)->format('l'));
        $schedule = $doctor->schedules->where('day_of_week', $dayOfWeek)->where('status', 'active')->first();

        if (!$isEmergency) {
            if (!$schedule) {
                throw ValidationException::withMessages([
                    'appointment_date' => ["Doctor does not conduct outpatient consultations on {$dayOfWeek}s."],
                ]);
            }

            // Verify start_time is inside schedule window
            $schedStart = substr($schedule->start_time, 0, 5);
            $schedEnd = substr($schedule->end_time, 0, 5);

            if ($startTime < $schedStart || $startTime >= $schedEnd) {
                throw ValidationException::withMessages([
                    'start_time' => ["Selected time {$startTime} is outside the doctor's consultation hours ({$schedStart} - {$schedEnd})."],
                ]);
            }
        }

        // 4. Calculate End Time
        $slotMinutes = $schedule ? $schedule->slot_duration_minutes : 30;
        $endTime = Carbon::createFromFormat('H:i', $startTime)->addMinutes($slotMinutes)->format('H:i:s');
        $startTimeSql = Carbon::createFromFormat('H:i', $startTime)->format('H:i:s');

        // 5. Strict Double-Booking & Daily Cap Checks
        $existingAppointment = Appointment::where('doctor_id', $doctor->id)
            ->where('appointment_date', $appointmentDate)
            ->where('start_time', $startTimeSql)
            ->whereNotIn('status', ['cancelled'])
            ->exists();

        if ($existingAppointment) {
            throw ValidationException::withMessages([
                'start_time' => ['This time slot is already booked for another patient. Please select another slot.'],
            ]);
        }

        if (!$isEmergency) {
            $dailyBookingsCount = Appointment::where('doctor_id', $doctor->id)
                ->where('appointment_date', $appointmentDate)
                ->whereNotIn('status', ['cancelled'])
                ->count();

            if ($dailyBookingsCount >= $doctor->max_daily_appointments) {
                throw ValidationException::withMessages([
                    'appointment_date' => ['Doctor has reached maximum patient consultation capacity for this date.'],
                ]);
            }
        }

        // 6. DB Transaction to create Appointment & Notifications
        $appointment = DB::transaction(function () use (
            $patient,
            $doctor,
            $branchId,
            $appointmentDate,
            $startTimeSql,
            $endTime,
            $validated,
            $isEmergency
        ) {
            $appointment = Appointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'branch_id' => $branchId,
                'booking_reference' => Appointment::generateBookingReference(),
                'appointment_date' => $appointmentDate,
                'start_time' => $startTimeSql,
                'end_time' => $endTime,
                'appointment_type' => $validated['appointment_type'] ?? ($isEmergency ? 'emergency' : 'general'),
                'is_emergency' => $isEmergency,
                'status' => $isEmergency ? 'confirmed' : 'pending',
                'reason' => $validated['reason'],
                'notes' => $validated['notes'] ?? null,
            ]);

            // Create notification for patient
            Notification::create([
                'user_id' => $patient->user_id,
                'title' => 'Appointment Booked',
                'message' => "Your consultation with {$doctor->user?->name} is confirmed for {$appointmentDate} at {$startTimeSql}. Booking Ref: {$appointment->booking_reference}",
                'notification_type' => 'appointment',
                'is_read' => false,
            ]);

            // Create notification for doctor
            if ($doctor->user_id) {
                Notification::create([
                    'user_id' => $doctor->user_id,
                    'title' => $isEmergency ? '🚨 URGENT: Emergency Appointment Booked' : 'New Appointment Booked',
                    'message' => "Patient {$patient->user?->name} booked for {$appointmentDate} at {$startTimeSql}. Reason: {$appointment->reason}",
                    'notification_type' => 'appointment',
                    'is_read' => false,
                ]);
            }

            return $appointment;
        });

        $appointment->load([
            'patient.user',
            'patient.insuranceProvider',
            'doctor.user',
            'doctor.specialty',
            'doctor.department',
            'branch',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Appointment booked successfully.',
            'booking_reference' => $appointment->booking_reference,
            'data' => new AppointmentResource($appointment),
        ], 201);
    }

    /**
     * Display the specified appointment.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $appointment = Appointment::with([
            'patient.user',
            'patient.insuranceProvider',
            'doctor.user',
            'doctor.specialty',
            'doctor.department',
            'branch',
        ])->findOrFail($id);

        // Security check
        if ($user->role === 'patient' && $appointment->patient_id !== $user->patient?->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized access.'], 403);
        }

        if ($user->role === 'doctor' && $appointment->doctor_id !== $user->doctor?->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized access.'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => new AppointmentResource($appointment),
        ]);
    }
}
