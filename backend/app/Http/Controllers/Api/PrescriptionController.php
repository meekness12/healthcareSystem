<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePrescriptionRequest;
use App\Http\Resources\PrescriptionResource;
use App\Models\AuditLog;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PrescriptionController extends Controller
{
    /**
     * List prescriptions with role-based scoping.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Prescription::query()
            ->with(['items.medicine', 'doctor.user', 'doctor.specialty', 'patient.user', 'patient.insuranceProvider']);

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
        }

        if ($request->has('status')) {
            $query->status($request->input('status'));
        }

        $prescriptions = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'count' => $prescriptions->count(),
            'data' => PrescriptionResource::collection($prescriptions),
        ]);
    }

    /**
     * Issue a multi-item electronic prescription.
     */
    public function store(StorePrescriptionRequest $request): JsonResponse
    {
        $user = $request->user();
        $doctor = $user->doctor;

        if (!$doctor && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only authorized clinical doctors can issue prescriptions.',
            ], 403);
        }

        $consultation = Consultation::findOrFail($request->input('consultation_id'));

        // If admin, use consultation's doctor if not provided
        $doctorId = $doctor ? $doctor->id : $consultation->doctor_id;

        $prescription = DB::transaction(function () use ($request, $consultation, $doctorId) {
            $prescription = Prescription::create([
                'consultation_id' => $consultation->id,
                'doctor_id' => $doctorId,
                'patient_id' => $consultation->patient_id,
                'prescription_number' => Prescription::generatePrescriptionNumber(),
                'prescription_date' => now()->format('Y-m-d'),
                'instructions' => $request->input('instructions'),
                'status' => 'issued',
            ]);

            foreach ($request->input('items') as $item) {
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

            return $prescription;
        });

        // Audit Log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'ISSUE_PRESCRIPTION',
            'target_table' => 'prescriptions',
            'target_id' => $prescription->id,
            'ip_address' => $request->ip(),
        ]);

        $prescription->load(['items.medicine', 'doctor.user', 'doctor.specialty', 'patient.user', 'patient.insuranceProvider']);

        return response()->json([
            'success' => true,
            'message' => 'Electronic prescription issued successfully.',
            'data' => new PrescriptionResource($prescription),
        ], 201);
    }

    /**
     * Show detailed single prescription.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $prescription = Prescription::query()
            ->with(['items.medicine', 'doctor.user', 'doctor.specialty', 'patient.user', 'patient.insuranceProvider', 'consultation'])
            ->find($id);

        if (!$prescription) {
            return response()->json([
                'success' => false,
                'message' => 'Prescription not found.',
            ], 404);
        }

        // Authorization check
        if ($user->role === 'patient') {
            $patient = $user->patient;
            if (!$patient || $prescription->patient_id !== $patient->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to prescription records.',
                ], 403);
            }
        }

        return response()->json([
            'success' => true,
            'data' => new PrescriptionResource($prescription),
        ]);
    }

    /**
     * Update prescription status (cancel / dispense).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:issued,partially_dispensed,dispensed,cancelled'],
        ]);

        $prescription = Prescription::findOrFail($id);
        $prescription->status = $request->input('status');
        $prescription->save();

        return response()->json([
            'success' => true,
            'message' => "Prescription status updated to {$prescription->status}.",
            'data' => new PrescriptionResource($prescription->load(['items.medicine', 'doctor.user', 'patient.user'])),
        ]);
    }
}
