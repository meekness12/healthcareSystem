<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PublicDataController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\SpecialtyController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\DoctorScheduleController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\EmergencyTriageController;
use App\Http\Controllers\Api\MedicineController;
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\ConsultationController;
use App\Http\Controllers\Api\MedicalRecordFileController;
use App\Http\Controllers\Api\LabTestController;
use App\Http\Controllers\Api\PharmacyController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\InsuranceClaimController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\UserManagementController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\ExportController;

/*
|--------------------------------------------------------------------------
| API Routes - Healthcare System Rwanda
|--------------------------------------------------------------------------
*/

// Health Check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'system' => 'Healthcare System Rwanda API',
        'version' => '1.0.0',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Public Hospital Directory & Reference Data
Route::get('/insurance-providers', [PublicDataController::class, 'insuranceProviders']);
Route::get('/branches', [BranchController::class, 'index']);
Route::get('/branches/{id}', [BranchController::class, 'show']);
Route::get('/departments', [DepartmentController::class, 'index']);
Route::get('/departments/{id}', [DepartmentController::class, 'show']);
Route::get('/specialties', [SpecialtyController::class, 'index']);
Route::get('/doctors', [DoctorController::class, 'index']);
Route::get('/doctors/{id}', [DoctorController::class, 'show']);
Route::get('/doctors/{id}/schedules', [DoctorScheduleController::class, 'show']);
Route::get('/doctors/{id}/available-slots', [DoctorScheduleController::class, 'availableSlots']);

// Public Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected Routes (Sanctum Bearer Token)
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'changePassword']);
        Route::post('/avatar', [AuthController::class, 'uploadAvatar']);
    });

    // Clinical Appointments Lifecycle
    Route::prefix('appointments')->group(function () {
        Route::get('/', [AppointmentController::class, 'index']);
        Route::post('/', [AppointmentController::class, 'store']);
        Route::get('/{id}', [AppointmentController::class, 'show']);
        Route::put('/{id}/status', [AppointmentController::class, 'updateStatus']);
        Route::put('/{id}/reschedule', [AppointmentController::class, 'reschedule']);
    });

    // Emergency Triage Fast-Track
    Route::post('/emergency/triage-intake', [EmergencyTriageController::class, 'intake']);

    // Essential Medicines Catalogue
    Route::get('/medicines', [MedicineController::class, 'index']);
    Route::get('/medicines/categories', [MedicineController::class, 'categories']);
    Route::get('/medicines/{id}', [MedicineController::class, 'show']);

    // Electronic Prescriptions
    Route::prefix('prescriptions')->group(function () {
        Route::get('/', [PrescriptionController::class, 'index']);
        Route::post('/', [PrescriptionController::class, 'store']);
        Route::get('/{id}', [PrescriptionController::class, 'show']);
        Route::patch('/{id}/status', [PrescriptionController::class, 'updateStatus']);
    });

    // Clinical Consultations & Patient EHR History
    Route::prefix('consultations')->group(function () {
        Route::get('/', [ConsultationController::class, 'index']);
        Route::post('/', [ConsultationController::class, 'store']);
        Route::get('/{id}', [ConsultationController::class, 'show']);
    });
    Route::get('/patients/{patientId}/consultation-history', [ConsultationController::class, 'patientHistory']);

    // Medical Record Files & Diagnostic Scans
    Route::get('/patients/{patientId}/medical-files', [MedicalRecordFileController::class, 'index']);
    Route::post('/patients/{patientId}/medical-files', [MedicalRecordFileController::class, 'upload']);
    Route::get('/medical-files/{id}/download', [MedicalRecordFileController::class, 'download']);

    // Laboratory Diagnostics Workflow
    Route::prefix('lab')->group(function () {
        Route::get('/test-types', [LabTestController::class, 'testTypes']);
        Route::get('/tests', [LabTestController::class, 'index']);
        Route::post('/tests', [LabTestController::class, 'store']);
        Route::post('/tests/{id}/assign', [LabTestController::class, 'assign']);
        Route::post('/tests/{id}/result', [LabTestController::class, 'recordResult']);
        Route::get('/results/{id}/download', [LabTestController::class, 'downloadReport']);
    });

    // Pharmacy Dispensary & Inventory Workflow
    Route::prefix('pharmacy')->group(function () {
        Route::get('/prescriptions', [PharmacyController::class, 'prescriptions']);
        Route::post('/dispense', [PharmacyController::class, 'dispense']);
        Route::get('/inventory', [PharmacyController::class, 'inventory']);
        Route::get('/history', [PharmacyController::class, 'history']);
    });

    // Invoicing & Revenue Management
    Route::prefix('invoices')->group(function () {
        Route::get('/', [InvoiceController::class, 'index']);
        Route::post('/', [InvoiceController::class, 'store']);
        Route::get('/{id}', [InvoiceController::class, 'show']);
        Route::post('/generate-from-appointment/{appointmentId}', [InvoiceController::class, 'generateFromAppointment']);
        Route::get('/{id}/pdf', [InvoiceController::class, 'downloadPdf']);
    });

    // Payments & Checkout Workflow
    Route::prefix('payments')->group(function () {
        Route::get('/', [PaymentController::class, 'index']);
        Route::post('/', [PaymentController::class, 'store']);
        Route::get('/{id}', [PaymentController::class, 'show']);
        Route::get('/{id}/receipt', [PaymentController::class, 'receipt']);
        Route::get('/{id}/receipt/pdf', [PaymentController::class, 'downloadReceiptPdf']);
    });

    // Insurance Claims & Adjudication
    Route::prefix('insurance-claims')->group(function () {
        Route::get('/', [InsuranceClaimController::class, 'index']);
        Route::get('/stats', [InsuranceClaimController::class, 'stats']);
        Route::post('/', [InsuranceClaimController::class, 'store']);
        Route::get('/{id}', [InsuranceClaimController::class, 'show']);
        Route::patch('/{id}/status', [InsuranceClaimController::class, 'updateStatus']);
    });

    // Doctor Clinical Controls
    Route::prefix('doctor')->group(function () {
        Route::put('/my-schedule', [DoctorScheduleController::class, 'updateMySchedule']);
    });

    // Executive Administration, Facility Management, Analytics, Users, Audit Logs, and Exports (Admin Only)
    Route::prefix('admin')->middleware('admin')->group(function () {
        // Facility & Provider Setup
        Route::post('/branches', [BranchController::class, 'store']);
        Route::put('/branches/{id}', [BranchController::class, 'update']);
        Route::delete('/branches/{id}', [BranchController::class, 'destroy']);
        Route::post('/departments', [DepartmentController::class, 'store']);
        Route::put('/departments/{id}', [DepartmentController::class, 'update']);
        Route::delete('/departments/{id}', [DepartmentController::class, 'destroy']);
        Route::put('/doctors/{id}', [DoctorController::class, 'adminUpdate']);

        // Analytics & Recharts Metrics
        Route::prefix('analytics')->group(function () {
            Route::get('/overview', [AnalyticsController::class, 'overview']);
            Route::get('/appointment-trends', [AnalyticsController::class, 'appointmentTrends']);
            Route::get('/revenue-by-branch', [AnalyticsController::class, 'revenueByBranch']);
            Route::get('/department-workloads', [AnalyticsController::class, 'departmentWorkloads']);
            Route::get('/kpis', [AnalyticsController::class, 'kpiMetrics']);
        });

        // User Management (All 6 Roles)
        Route::prefix('users')->group(function () {
            Route::get('/', [UserManagementController::class, 'index']);
            Route::post('/', [UserManagementController::class, 'store']);
            Route::get('/{id}', [UserManagementController::class, 'show']);
            Route::put('/{id}', [UserManagementController::class, 'update']);
            Route::patch('/{id}/status', [UserManagementController::class, 'toggleStatus']);
        });

        // Security Audit Trail
        Route::prefix('audit-logs')->group(function () {
            Route::get('/', [AuditLogController::class, 'index']);
            Route::get('/{id}', [AuditLogController::class, 'show']);
        });

        // Data & Report Exports
        Route::prefix('export')->group(function () {
            Route::get('/appointments-csv', [ExportController::class, 'appointmentsCsv']);
            Route::get('/revenue-csv', [ExportController::class, 'revenueCsv']);
            Route::get('/audit-logs-csv', [ExportController::class, 'auditLogsCsv']);
            Route::get('/executive-report-pdf', [ExportController::class, 'executiveReportPdf']);
        });
    });
});
