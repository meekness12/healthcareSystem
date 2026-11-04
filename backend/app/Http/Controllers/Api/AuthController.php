<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\AvatarUploadRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Patient Self-Registration with Automatic Demographic & Insurance Profiling.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = DB::transaction(function () use ($validated) {
            // 1. Create base user
            $user = User::create([
                'name' => $validated['name'],
                'email' => strtolower(trim($validated['email'])),
                'phone' => trim($validated['phone']),
                'password' => Hash::make($validated['password']),
                'role' => 'patient',
                'status' => 'active',
            ]);

            // 2. Generate unique sequential patient ID number (e.g., PAT-2026-0005)
            $year = date('Y');
            $patientCount = Patient::count() + 1;
            $patientNumber = sprintf('PAT-%s-%04d', $year, $patientCount);

            // 3. Create linked patient profile
            Patient::create([
                'user_id' => $user->id,
                'patient_number' => $patientNumber,
                'dob' => $validated['dob'],
                'gender' => $validated['gender'],
                'national_id' => $validated['national_id'] ?? null,
                'address' => $validated['address'],
                'emergency_contact_name' => $validated['emergency_contact_name'],
                'emergency_contact_phone' => $validated['emergency_contact_phone'],
                'insurance_provider_id' => $validated['insurance_provider_id'] ?? null,
                'insurance_number' => $validated['insurance_number'] ?? null,
                'allergies' => $validated['allergies'] ?? null,
            ]);

            return $user;
        });

        $user->load(['patient.insuranceProvider']);
        $token = $user->createToken('patient_auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful! Welcome to Healthcare System Rwanda.',
            'token' => $token,
            'user' => new UserResource($user),
        ], 201);
    }

    /**
     * User Login for All 6 Roles with Sanctum Token Generation.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $user = User::where('email', strtolower(trim($credentials['email'])))->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email address or password.'],
            ]);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Your account is currently inactive or suspended. Please contact hospital administration.',
            ], 403);
        }

        // Load specific profile based on role
        if ($user->role === 'patient') {
            $user->load(['patient.insuranceProvider']);
        } elseif ($user->role === 'doctor') {
            $user->load(['doctor.branch', 'doctor.department', 'doctor.specialty']);
        }

        // Revoke previous tokens optionally or create new token
        $token = $user->createToken("{$user->role}_token")->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'token' => $token,
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Authenticated User Information.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'patient') {
            $user->load(['patient.insuranceProvider']);
        } elseif ($user->role === 'doctor') {
            $user->load(['doctor.branch', 'doctor.department', 'doctor.specialty']);
        }

        return response()->json([
            'success' => true,
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Logout - Revoke Current Access Token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Successfully logged out.',
        ]);
    }

    /**
     * Update User Profile Demographics.
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        DB::transaction(function () use ($user, $validated) {
            // Update base user fields
            if (isset($validated['name'])) $user->name = $validated['name'];
            if (isset($validated['phone'])) $user->phone = $validated['phone'];
            $user->save();

            // Update patient profile if applicable
            if ($user->role === 'patient' && $user->patient) {
                $user->patient->update(array_filter([
                    'address' => $validated['address'] ?? null,
                    'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
                    'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
                    'insurance_provider_id' => $validated['insurance_provider_id'] ?? null,
                    'insurance_number' => $validated['insurance_number'] ?? null,
                    'allergies' => $validated['allergies'] ?? null,
                    'medical_history' => $validated['medical_history'] ?? null,
                ], fn($val) => !is_null($val)));
            }

            // Update doctor profile if applicable
            if ($user->role === 'doctor' && $user->doctor) {
                $user->doctor->update(array_filter([
                    'consultation_room' => $validated['consultation_room'] ?? null,
                    'consultation_fee' => $validated['consultation_fee'] ?? null,
                    'bio' => $validated['bio'] ?? null,
                ], fn($val) => !is_null($val)));
            }
        });

        if ($user->role === 'patient') {
            $user->load(['patient.insuranceProvider']);
        } elseif ($user->role === 'doctor') {
            $user->load(['doctor.branch', 'doctor.department', 'doctor.specialty']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Change User Password.
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Your current password does not match our records.'],
            ]);
        }

        $user->password = Hash::make($validated['new_password']);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }

    /**
     * Upload User Profile Photograph (Max 2MB, JPEG/PNG).
     */
    public function uploadAvatar(AvatarUploadRequest $request): JsonResponse
    {
        $user = $request->user();
        $file = $request->file('avatar');

        // Delete old avatar if not empty and exists in storage
        if ($user->avatar_url && Storage::disk('public')->exists($user->avatar_url)) {
            Storage::disk('public')->delete($user->avatar_url);
        }

        // Store new file with unique hash
        $path = $file->store('avatars', 'public');
        $user->avatar_url = $path;
        $user->save();

        if ($user->role === 'patient') {
            $user->load(['patient.insuranceProvider']);
        } elseif ($user->role === 'doctor') {
            $user->load(['doctor.branch', 'doctor.department', 'doctor.specialty']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile photograph uploaded successfully.',
            'avatar_url' => asset('storage/' . $path),
            'user' => new UserResource($user),
        ]);
    }
}
