<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\AuditLog;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserManagementController extends Controller
{
    /**
     * List users across all 6 roles with filtering
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with([
            'doctor.branch',
            'doctor.department',
            'doctor.specialty',
            'patient.insuranceProvider',
        ]);

        if ($request->filled('role')) {
            $query->role($request->input('role'));
        }

        if ($request->filled('status')) {
            $query->status($request->input('status'));
        }

        if ($request->filled('search')) {
            $query->search($request->input('search'));
        }

        if ($request->filled('branch_id')) {
            $branchId = (int) $request->input('branch_id');
            $query->whereHas('doctor', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $users = $query->latest()->paginate($perPage);

        return UserResource::collection($users)->response();
    }

    /**
     * Show single user with role profile and activity audit trail
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = User::with([
            'doctor.branch',
            'doctor.department',
            'doctor.specialty',
            'patient.insuranceProvider',
            'auditLogs' => function ($q) {
                $q->latest()->take(10);
            },
        ])->findOrFail($id);

        return (new UserResource($user))->response();
    }

    /**
     * Provision new user account (Staff or Patient)
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $admin = $request->user();

        $newUser = DB::transaction(function () use ($request, $admin) {
            $user = User::create([
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'phone' => $request->input('phone'),
                'password' => Hash::make($request->input('password')),
                'role' => $request->input('role'),
                'status' => $request->input('status', 'active'),
            ]);

            // If creating doctor, create doctor profile
            if ($user->role === 'doctor') {
                Doctor::create([
                    'user_id' => $user->id,
                    'branch_id' => $request->input('branch_id'),
                    'department_id' => $request->input('department_id'),
                    'specialty_id' => $request->input('specialty_id'),
                    'consultation_fee' => $request->input('consultation_fee', 5000.00),
                    'consultation_room' => $request->input('consultation_room', 'Room 101'),
                    'license_number' => $request->input('license_number', 'MD-RW-' . rand(1000, 9999)),
                    'max_daily_appointments' => $request->input('max_daily_appointments', 20),
                    'status' => 'active',
                ]);
            }

            // If creating patient, create patient profile
            if ($user->role === 'patient') {
                $patientCount = Patient::count() + 1;
                Patient::create([
                    'user_id' => $user->id,
                    'patient_number' => 'PAT-' . date('Y') . '-' . str_pad((string) $patientCount, 4, '0', STR_PAD_LEFT),
                    'gender' => $request->input('gender', 'male'),
                    'dob' => $request->input('dob', '1995-01-01'),
                    'national_id' => $request->input('national_id'),
                    'address' => $request->input('address', 'Kigali, Rwanda'),
                    'insurance_provider_id' => $request->input('insurance_provider_id'),
                    'insurance_number' => $request->input('insurance_number'),
                ]);
            }

            AuditLog::record(
                'USER_CREATED',
                'users',
                $user->id,
                [
                    'created_by' => $admin ? $admin->email : 'system',
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                $admin?->id
            );

            return $user;
        });

        $newUser->load([
            'doctor.branch',
            'doctor.department',
            'doctor.specialty',
            'patient.insuranceProvider',
        ]);

        return (new UserResource($newUser))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Update existing user profile and credentials
     */
    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $admin = $request->user();
        $user = User::findOrFail($id);

        DB::transaction(function () use ($request, $user, $admin) {
            $data = $request->only(['name', 'email', 'phone', 'role', 'status']);
            if ($request->filled('password')) {
                $data['password'] = Hash::make($request->input('password'));
            }

            $user->update($data);

            if ($user->role === 'doctor' && $user->doctor) {
                $doctorData = $request->only([
                    'branch_id',
                    'department_id',
                    'specialty_id',
                    'consultation_fee',
                    'consultation_room',
                    'license_number',
                    'max_daily_appointments',
                ]);
                $user->doctor->update(array_filter($doctorData, fn ($v) => !is_null($v)));
            }

            AuditLog::record(
                'USER_UPDATED',
                'users',
                $user->id,
                [
                    'updated_by' => $admin ? $admin->email : 'system',
                    'updated_fields' => array_keys($data),
                ],
                $admin?->id
            );
        });

        $user->load([
            'doctor.branch',
            'doctor.department',
            'doctor.specialty',
            'patient.insuranceProvider',
        ]);

        return (new UserResource($user))->response();
    }

    /**
     * Toggle or set user status (active, inactive, suspended)
     */
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:active,inactive,suspended',
        ]);

        $admin = $request->user();
        $user = User::findOrFail($id);
        $oldStatus = $user->status;
        $newStatus = $request->input('status');

        $user->status = $newStatus;
        $user->save();

        AuditLog::record(
            'USER_STATUS_TOGGLED',
            'users',
            $user->id,
            [
                'admin_id' => $admin?->id,
                'admin_email' => $admin?->email,
                'target_user' => $user->email,
                'previous_status' => $oldStatus,
                'new_status' => $newStatus,
            ],
            $admin?->id
        );

        return response()->json([
            'message' => "User {$user->name} status successfully updated to {$newStatus}.",
            'data' => new UserResource($user),
        ]);
    }
}
