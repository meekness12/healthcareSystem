<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RecordLabResultRequest;
use App\Http\Requests\StoreLabTestRequest;
use App\Http\Resources\LabResultResource;
use App\Http\Resources\LabTestResource;
use App\Models\AuditLog;
use App\Models\LabResult;
use App\Models\LabTest;
use App\Models\LabTestType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class LabTestController extends Controller
{
    /**
     * Get active laboratory test types catalogue.
     */
    public function testTypes(Request $request): JsonResponse
    {
        $query = LabTestType::query()->active();

        if ($term = $request->input('q') ?? $request->input('search')) {
            $query->search($term);
        }

        if ($category = $request->input('category')) {
            $query->category($category);
        }

        $types = $query->orderBy('category')->orderBy('test_name')->get();

        return response()->json([
            'success' => true,
            'count' => $types->count(),
            'data' => $types,
        ]);
    }

    /**
     * List lab tests with role-aware scoping and filter criteria.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = LabTest::query()
            ->with(['testType', 'patient.user', 'patient.insuranceProvider', 'requestedBy', 'assignedTo', 'result.recordedBy']);

        // Role-based scoping
        if ($user->role === 'patient') {
            $patient = $user->patient;
            if (!$patient) {
                return response()->json(['success' => true, 'data' => []]);
            }
            $query->forPatient($patient->id);
        } elseif ($user->role === 'doctor') {
            if ($request->has('patient_id')) {
                $query->forPatient((int) $request->input('patient_id'));
            } elseif (!$request->boolean('all_hospital', false)) {
                $query->where('requested_by', $user->id);
            }
        } elseif ($user->role === 'lab_technician') {
            if ($request->boolean('my_assigned_only', false)) {
                $query->forTechnician($user->id);
            }
        }

        // Status filter
        if ($status = $request->input('status')) {
            if ($status === 'pending') {
                $query->pending();
            } elseif ($status === 'in_progress') {
                $query->inProgress();
            } elseif ($status === 'completed') {
                $query->completed();
            } elseif ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        // Priority filter
        if ($priority = $request->input('priority')) {
            $query->priority($priority);
        }

        // Patient filter
        if ($request->has('patient_id') && $user->role !== 'patient') {
            $query->forPatient((int) $request->input('patient_id'));
        }

        $tests = $query->recent()->get();

        return response()->json([
            'success' => true,
            'count' => $tests->count(),
            'data' => LabTestResource::collection($tests),
        ]);
    }

    /**
     * Order a new diagnostic laboratory test.
     */
    public function store(StoreLabTestRequest $request): JsonResponse
    {
        $user = $request->user();

        $labTest = LabTest::create([
            'appointment_id' => $request->input('appointment_id'),
            'consultation_id' => $request->input('consultation_id'),
            'patient_id' => $request->input('patient_id'),
            'test_type_id' => $request->input('test_type_id'),
            'requested_by' => $user->id,
            'priority' => $request->input('priority', 'routine'),
            'request_date' => now(),
            'status' => 'pending',
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'ORDER_LAB_TEST',
            'target_table' => 'lab_tests',
            'target_id' => $labTest->id,
            'ip_address' => $request->ip(),
        ]);

        $labTest->load(['testType', 'patient.user', 'requestedBy']);

        return response()->json([
            'success' => true,
            'message' => 'Laboratory diagnostic test ordered successfully.',
            'data' => new LabTestResource($labTest),
        ], 201);
    }

    /**
     * Lab technician claims a test and changes status to in_progress.
     */
    public function assign(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!in_array($user->role, ['lab_technician', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only authorized laboratory personnel can claim tests.',
            ], 403);
        }

        $labTest = LabTest::findOrFail($id);

        if ($labTest->status === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'This lab test is already completed.',
            ], 422);
        }

        $labTest->assigned_to = $user->id;
        $labTest->status = 'in_progress';
        $labTest->save();

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'CLAIM_LAB_TEST',
            'target_table' => 'lab_tests',
            'target_id' => $labTest->id,
            'ip_address' => $request->ip(),
        ]);

        $labTest->load(['testType', 'patient.user', 'requestedBy', 'assignedTo']);

        return response()->json([
            'success' => true,
            'message' => 'Lab test claimed. Status transitioned to In Progress.',
            'data' => new LabTestResource($labTest),
        ]);
    }

    /**
     * Record diagnostic observations and upload PDF report.
     */
    public function recordResult(RecordLabResultRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $labTest = LabTest::with(['patient', 'result'])->findOrFail($id);

        if ($labTest->result) {
            return response()->json([
                'success' => false,
                'message' => 'Diagnostic results have already been recorded for this test.',
                'result_id' => $labTest->result->id,
            ], 422);
        }

        $pdfPath = null;
        if ($request->hasFile('report_pdf')) {
            $pdfPath = $request->file('report_pdf')->store('lab_reports', 'public');
        }

        $result = DB::transaction(function () use ($request, $labTest, $user, $pdfPath) {
            $result = LabResult::create([
                'lab_test_id' => $labTest->id,
                'result_summary' => $request->input('result_summary'),
                'result_details' => $request->input('result_details'),
                'reference_ranges' => $request->input('reference_ranges'),
                'report_pdf_path' => $pdfPath,
                'recorded_by' => $user->id,
                'result_date' => now(),
            ]);

            $labTest->status = 'completed';
            $labTest->assigned_to = $labTest->assigned_to ?? $user->id;
            $labTest->save();

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'RECORD_LAB_RESULT',
                'target_table' => 'lab_results',
                'target_id' => $result->id,
                'ip_address' => $request->ip(),
            ]);

            return $result;
        });

        $labTest->refresh()->load(['testType', 'patient.user', 'requestedBy', 'assignedTo', 'result.recordedBy']);

        return response()->json([
            'success' => true,
            'message' => 'Diagnostic results recorded and test completed successfully.',
            'data' => new LabTestResource($labTest),
        ], 201);
    }

    /**
     * Download or stream the laboratory PDF report.
     */
    public function downloadReport(Request $request, int $id)
    {
        $user = $request->user();
        $result = LabResult::with('labTest.patient')->findOrFail($id);

        // Security check
        if ($user->role === 'patient') {
            $patient = $user->patient;
            if (!$patient || $result->labTest->patient_id !== $patient->id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized access to report.'], 403);
            }
        }

        if (!$result->report_pdf_path || !Storage::disk('public')->exists($result->report_pdf_path)) {
            return response()->json(['success' => false, 'message' => 'Report PDF document not found on storage.'], 404);
        }

        $fileName = 'LabReport_' . ($result->labTest->testType->test_name ?? 'Test') . '_' . $result->id . '.pdf';
        return Storage::disk('public')->download($result->report_pdf_path, $fileName);
    }
}
