<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EmergencyTriageRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Notification;
use App\Models\Patient;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class EmergencyTriageController extends Controller
{
    /**
     * Fast-Track Emergency Triage Intake.
     * Allocates immediate consultation queue token and alerts on-duty medical staff.
     */
    public function intake(EmergencyTriageRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $branchId = $validated['branch_id'];

        // 1. Resolve Patient
        $patient = null;
        if ($user->role === 'patient') {
            $patient = $user->patient;
        } elseif (!empty($validated['patient_id'])) {
            $patient = Patient::find($validated['patient_id']);
        }

        // If walk-in patient without record, create emergency patient profile
        if (!$patient) {
            $walkInName = $validated['walk_in_name'] ?? 'Emergency Walk-In ' . uniqid();
            $walkInPhone = $validated['walk_in_phone'] ?? '+250788000000';

            $patient = DB::transaction(function () use ($walkInName, $walkInPhone) {
                $walkInUser = User::create([
                    'name' => $walkInName,
                    'email' => 'triage.' . uniqid() . '@emergency.rw',
                    'phone' => $walkInPhone,
                    'password' => Hash::make(uniqid('EmgPass!')),
                    'role' => 'patient',
                    'status' => 'active',
                ]);

                return Patient::create([
                    'user_id' => $walkInUser->id,
                    'patient_number' => sprintf('EMG-PAT-%s-%04d', date('Y'), Patient::count() + 1),
                    'dob' => '1990-01-01',
                    'gender' => 'other',
                    'address' => 'Emergency Triage Admission',
                    'emergency_contact_name' => 'Hospital Triage Desk',
                    'emergency_contact_phone' => '+250788123000',
                ]);
            });
        }

        // 2. Resolve On-Duty Emergency Doctor at Branch
        $doctor = Doctor::where('branch_id', $branchId)
            ->where('status', 'active')
            ->whereHas('department', function ($dq) {
                $dq->where('department_name', 'like', '%Emergency%')
                   ->orWhere('department_name', 'like', '%Triage%')
                   ->orWhere('department_name', 'like', '%Internal%');
            })
            ->first();

        // Fallback to any active doctor at branch if emergency department is unstaffed
        if (!$doctor) {
            $doctor = Doctor::where('branch_id', $branchId)->where('status', 'active')->first();
        }

        if (!$doctor) {
            // Global fallback
            $doctor = Doctor::where('status', 'active')->first();
        }

        if (!$doctor) {
            throw ValidationException::withMessages([
                'branch_id' => ['No active medical doctors found at this hospital branch.'],
            ]);
        }

        // 3. Create Emergency Appointment and Dispatch Alert
        $now = Carbon::now('Africa/Kigali');
        $triageLevel = strtoupper(str_replace('_', ' ', $validated['triage_level']));
        $vitalSignsSummary = !empty($validated['vital_signs']) ? json_encode($validated['vital_signs']) : null;

        $emergencyAppointment = DB::transaction(function () use (
            $patient,
            $doctor,
            $branchId,
            $now,
            $triageLevel,
            $validated,
            $vitalSignsSummary
        ) {
            $count = Appointment::where('is_emergency', true)->whereYear('created_at', date('Y'))->count() + 1;
            $reference = sprintf('EMG-%s-%04d', date('Y'), $count);

            $appointment = Appointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'branch_id' => $branchId,
                'booking_reference' => $reference,
                'appointment_date' => $now->toDateString(),
                'start_time' => $now->format('H:i:s'),
                'end_time' => $now->copy()->addMinutes(30)->format('H:i:s'),
                'appointment_type' => 'emergency',
                'is_emergency' => true,
                'status' => 'confirmed',
                'reason' => "[{$triageLevel}] " . $validated['symptoms'],
                'notes' => $vitalSignsSummary ? "Vitals: {$vitalSignsSummary}" : 'Emergency Triage Fast-Track',
            ]);

            // High-priority notification to on-duty doctor
            if ($doctor->user_id) {
                Notification::create([
                    'user_id' => $doctor->user_id,
                    'title' => "🚨 EMERGENCY TRIAGE: {$triageLevel}",
                    'message' => "High-priority patient {$patient->user?->name} admitted at {$appointment->branch?->branch_name}. Ref: {$reference}",
                    'notification_type' => 'appointment',
                    'is_read' => false,
                ]);
            }

            // Notification to patient
            if ($patient->user_id) {
                Notification::create([
                    'user_id' => $patient->user_id,
                    'title' => 'Emergency Triage Admission Confirmed',
                    'message' => "Emergency priority token {$reference} issued. Assigned to {$doctor->user?->name}.",
                    'notification_type' => 'appointment',
                    'is_read' => false,
                ]);
            }

            return $appointment;
        });

        $emergencyAppointment->load([
            'patient.user',
            'patient.insuranceProvider',
            'doctor.user',
            'doctor.specialty',
            'doctor.department',
            'branch',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Emergency triage intake completed. Medical alert dispatched.',
            'queue_token' => $emergencyAppointment->booking_reference,
            'triage_level' => $triageLevel,
            'data' => new AppointmentResource($emergencyAppointment),
        ], 201);
    }
}
