<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadMedicalRecordFileRequest;
use App\Http\Resources\MedicalRecordFileResource;
use App\Models\AuditLog;
use App\Models\Consultation;
use App\Models\MedicalRecordFile;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MedicalRecordFileController extends Controller
{
    /**
     * List medical documents and diagnostic files for a patient.
     */
    public function index(Request $request, int $patientId): JsonResponse
    {
        $user = $request->user();

        // Patient role access restriction
        if ($user->role === 'patient') {
            $patient = $user->patient;
            if (!$patient || $patient->id !== $patientId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to medical record files.',
                ], 403);
            }
        }

        $patient = Patient::findOrFail($patientId);

        $query = MedicalRecordFile::query()
            ->where('patient_id', $patient->id)
            ->with(['uploadedBy']);

        if ($consultationId = $request->input('consultation_id')) {
            $query->where('consultation_id', (int) $consultationId);
        }

        $files = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'count' => $files->count(),
            'data' => MedicalRecordFileResource::collection($files),
        ]);
    }

    /**
     * Upload an external laboratory report, diagnostic scan, or clinical document.
     */
    public function upload(UploadMedicalRecordFileRequest $request, int $patientId): JsonResponse
    {
        $user = $request->user();

        // Patient can only upload to own record; clinicians can upload to any assigned patient
        if ($user->role === 'patient') {
            $patient = $user->patient;
            if (!$patient || $patient->id !== $patientId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized upload attempt.',
                ], 403);
            }
        } else {
            $patient = Patient::findOrFail($patientId);
        }

        $uploadedFile = $request->file('file');
        $extension = strtolower($uploadedFile->getClientOriginalExtension());
        $originalName = $request->input('file_name') ?? $uploadedFile->getClientOriginalName();

        // Store file securely in public/medical_records disk
        $path = $uploadedFile->store('medical_records', 'public');

        $record = MedicalRecordFile::create([
            'patient_id' => $patient->id,
            'consultation_id' => $request->input('consultation_id'),
            'file_name' => $originalName,
            'file_path' => $path,
            'file_type' => $extension,
            'uploaded_by' => $user->id,
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'UPLOAD_MEDICAL_FILE',
            'target_table' => 'medical_record_files',
            'target_id' => $record->id,
            'ip_address' => $request->ip(),
        ]);

        $record->load(['uploadedBy']);

        return response()->json([
            'success' => true,
            'message' => 'Medical document uploaded and attached to health record successfully.',
            'data' => new MedicalRecordFileResource($record),
        ], 201);
    }

    /**
     * Stream or download a medical file with permission checking.
     */
    public function download(Request $request, int $id)
    {
        $user = $request->user();
        $file = MedicalRecordFile::findOrFail($id);

        if ($user->role === 'patient') {
            $patient = $user->patient;
            if (!$patient || $file->patient_id !== $patient->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this document.',
                ], 403);
            }
        }

        if (!Storage::disk('public')->exists($file->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found on server storage.',
            ], 404);
        }

        return Storage::disk('public')->download($file->file_path, $file->file_name);
    }
}
