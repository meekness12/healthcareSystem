<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreConsultationRequest;
use App\Http\Resources\ConsultationResource;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConsultationController extends Controller
{
    /**
     * List consultations with role-based filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Consultation::query()
            ->with([
                'doctor.user',
                'doctor.specialty',
                'doctor.branch',
                'patient.user',
                'patient.insuranceProvider',
                'appointment.branch',
                'prescriptions.items.medicine',
            ]);

        if ($user->role === 'patient') {
            $patient = $user->patient;
            if (!$patient) {
                return response()->json(['success' => true, 'data' => []]);
            }
            $query->forPatient($patient->id);
        } elseif ($user->role === 'doctor') {
            $doctor = $user->doctor;
            if ($request->has('patient_id')) {
                $query->forPatient((int) $request->input('patient_id'));
            } elseif ($doctor && !$request->boolean('all_hospital', false)) {
                $query->forDoctor($doctor->id);
            }
        } elseif ($request->has('patient_id')) {
            $query->forPatient((int) $request->input('patient_id'));
        } elseif ($request->has('doctor_id')) {
            $query->forDoctor((int) $request->input('doctor_id'));
        }

        $consultations = $query->recent()->get();

        return response()->json([
            'success' => true,
            'count' => $consultations->count(),
            'data' => ConsultationResource::collection($consultations),
        ]);
    }

    /**
     * Create a clinical consultation encounter, mark appointment completed,
     * and optionally issue multi-item prescription in an atomic transaction.
     */
    public function store(StoreConsultationRequest $request): JsonResponse
    {
        $user = $request->user();
        $doctor = $user->doctor;

        $appointment = Appointment::with(['doctor', 'patient'])->findOrFail($request->input('appointment_id'));

        // Check if consultation already exists
        if ($appointment->consultation) {
            return response()->json([
                'success' => false,
                'message' => 'A consultation has already been recorded for this appointment.',
                'consultation_id' => $appointment->consultation->id,
            ], 422);
        }

        // Validate doctor authorization
        if ($user->role === 'doctor' && $doctor && $appointment->doctor_id !== $doctor->id) {
            return response()->json([
                'success' => false,
                'message' => 'You are not assigned as the primary clinician for this appointment.',
            ], 403);
        }

        $doctorId = $doctor ? $doctor->id : $appointment->doctor_id;

        $consultation = DB::transaction(function () use ($request, $appointment, $doctorId, $user) {
            // 1. Create Consultation
            $consultation = Consultation::create([
                'appointment_id' => $appointment->id,
                'doctor_id' => $doctorId,
                'patient_id' => $appointment->patient_id,
                'symptoms' => $request->input('symptoms'),
                'diagnosis' => $request->input('diagnosis'),
                'consultation_notes' => $request->input('consultation_notes'),
                'treatment_plan' => $request->input('treatment_plan'),
                'vitals' => $request->input('vitals'),
                'follow_up_date' => $request->input('follow_up_date'),
            ]);

            // 2. Transition Appointment status to completed
            $appointment->status = 'completed';
            $appointment->notes = ($appointment->notes ? $appointment->notes . ' | ' : '') .
                'Completed encounter by ' . ($user->name ?? 'Doctor') . ' on ' . now()->format('Y-m-d H:i');
            $appointment->save();

            // 3. Optional Embedded Prescription
            $prescriptionData = $request->input('prescription');
            if (!empty($prescriptionData) && !empty($prescriptionData['items'])) {
                $prescription = Prescription::create([
                    'consultation_id' => $consultation->id,
                    'doctor_id' => $doctorId,
                    'patient_id' => $appointment->patient_id,
                    'prescription_number' => Prescription::generatePrescriptionNumber(),
                    'prescription_date' => now()->format('Y-m-d'),
                    'instructions' => $prescriptionData['instructions'] ?? null,
                    'status' => 'issued',
                ]);

                foreach ($prescriptionData['items'] as $item) {
                    PrescriptionItem::create([
                        'prescription_id' => $prescription->id,
                        'medicine_id' => $item['medicine_id'],
                        'dosage' => $item['dosage'],
                        'frequency' => $item['frequency'],
                        'duration_days' => $item['duration_days'],
                        'quantity_prescribed' => $item['quantity_prescribed'],
                        'quantity_dispensed' => 0,
                        'instructions' => $item['instructions'] ?? null,
                    ]);
                }
            }

            // 4. Audit Log
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'RECORD_CONSULTATION',
                'target_table' => 'consultations',
                'target_id' => $consultation->id,
                'ip_address' => $request->ip(),
            ]);

            return $consultation;
        });

        $consultation->load([
            'doctor.user',
            'doctor.specialty',
            'doctor.branch',
            'patient.user',
            'patient.insuranceProvider',
            'appointment.branch',
            'prescriptions.items.medicine',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Clinical consultation completed and appointment closed successfully.',
            'data' => new ConsultationResource($consultation),
        ], 201);
    }

    /**
     * Show detailed single consultation.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $consultation = Consultation::query()
            ->with([
                'doctor.user',
                'doctor.specialty',
                'doctor.branch',
                'patient.user',
                'patient.insuranceProvider',
                'appointment.branch',
                'prescriptions.items.medicine',
                'medicalRecordFiles',
            ])
            ->find($id);

        if (!$consultation) {
            return response()->json([
                'success' => false,
                'message' => 'Consultation not found.',
            ], 404);
        }

        if ($user->role === 'patient') {
            $patient = $user->patient;
            if (!$patient || $consultation->patient_id !== $patient->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to consultation records.',
                ], 403);
            }
        }

        return response()->json([
            'success' => true,
            'data' => new ConsultationResource($consultation),
        ]);
    }

    /**
     * Get complete chronological consultation history for a patient (EHR Timeline).
     */
    public function patientHistory(Request $request, int $patientId): JsonResponse
    {
        $user = $request->user();

        // If patient, ensure can only see own history
        if ($user->role === 'patient') {
            $patient = $user->patient;
            if (!$patient || $patient->id !== $patientId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to patient clinical history.',
                ], 403);
            }
        }

        $patient = Patient::with(['user', 'insuranceProvider'])->find($patientId);
        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient record not found.',
            ], 404);
        }

        $consultations = Consultation::query()
            ->forPatient($patientId)
            ->with([
                'doctor.user',
                'doctor.specialty',
                'doctor.branch',
                'appointment.branch',
                'prescriptions.items.medicine',
                'medicalRecordFiles',
            ])
            ->recent()
            ->get();

        return response()->json([
            'success' => true,
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->user?->name,
                'patient_number' => $patient->patient_number,
                'dob' => $patient->dob,
                'gender' => $patient->gender,
                'allergies' => $patient->allergies,
                'medical_history' => $patient->medical_history,
                'insurance_provider' => $patient->insuranceProvider?->provider_name,
                'insurance_number' => $patient->insurance_number,
            ],
            'count' => $consultations->count(),
            'data' => ConsultationResource::collection($consultations),
        ]);
    }
}
