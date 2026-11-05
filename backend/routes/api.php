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

    // Doctor Clinical Controls
    Route::prefix('doctor')->group(function () {
        Route::put('/my-schedule', [DoctorScheduleController::class, 'updateMySchedule']);
    });

    // Administrative Facility Management
    Route::prefix('admin')->group(function () {
        Route::post('/branches', [BranchController::class, 'store']);
        Route::put('/branches/{id}', [BranchController::class, 'update']);
        Route::delete('/branches/{id}', [BranchController::class, 'destroy']);
        Route::post('/departments', [DepartmentController::class, 'store']);
        Route::put('/departments/{id}', [DepartmentController::class, 'update']);
        Route::delete('/departments/{id}', [DepartmentController::class, 'destroy']);
        Route::put('/doctors/{id}', [DoctorController::class, 'adminUpdate']);
    });
});
