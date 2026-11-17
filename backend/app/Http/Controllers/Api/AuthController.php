<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\AvatarUploadRequest;
use App\Http\Requests\SendOtpRequest;
use App\Http\Requests\VerifyOtpRequest;
use App\Http\Requests\ResetPasswordWithOtpRequest;
use App\Http\Resources\UserResource;
use App\Mail\UserWelcomeVerificationMail;
use App\Mail\PasswordResetOtpMail;
use App\Mail\PasswordResetSuccessMail;
use App\Models\User;
use App\Models\Patient;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        protected OtpService $otpService
    ) {}

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
            $maxPatient = Patient::where('patient_number', 'like', "PAT-{$year}-%")
                ->orderByDesc('id')
                ->first();
            $nextSeq = 1;
            if ($maxPatient && preg_match('/PAT-\d{4}-(\d+)/', $maxPatient->patient_number, $matches)) {
                $nextSeq = ((int) $matches[1]) + 1;
            }
            do {
                $patientNumber = sprintf('PAT-%s-%04d', $year, $nextSeq++);
            } while (Patient::where('patient_number', $patientNumber)->exists());

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

        // Generate and dispatch welcome verification OTP email
        $otpCode = null;
        try {
            $otpCode = $this->otpService->generateOtp($user->email, 'email_verification', 15);
            Mail::to($user->email)->send(new UserWelcomeVerificationMail($user, $user->patient, $otpCode, 15));
        } catch (\Throwable $e) {
            Log::warning("Failed to dispatch registration welcome email to {$user->email}: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Registration successful! Welcome to Healthcare System Rwanda.',
            'token' => $token,
            'user' => new UserResource($user),
            'otp_sent' => $otpCode !== null,
            'patient_number' => $user->patient?->patient_number,
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

    /**
     * Request Password Reset OTP Code via Email.
     */
    public function sendPasswordResetOtp(SendOtpRequest $request): JsonResponse
    {
        $email = strtolower(trim($request->validated()['email']));
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No active hospital account was found with that email address.',
            ], 404);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Your account is currently inactive. Please contact hospital administration.',
            ], 403);
        }

        try {
            $otp = $this->otpService->generateOtp($email, 'password_reset', 10);
            Mail::to($email)->send(new PasswordResetOtpMail($user, $otp, 10));
        } catch (ValidationException $ve) {
            throw $ve;
        } catch (\Throwable $e) {
            Log::error("Failed to send password reset OTP to {$email}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Unable to dispatch security code email at this moment. Please try again shortly.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => "A 6-digit verification code has been dispatched to {$email}. Please check your inbox and spam folder.",
        ]);
    }

    /**
     * Verify 6-digit Password Reset OTP Code and Mint Single-Use Reset Token.
     */
    public function verifyPasswordResetOtp(VerifyOtpRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $result = $this->otpService->verifyOtp($validated['email'], $validated['otp_code'], 'password_reset');

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'reset_token' => $result['reset_token'],
        ]);
    }

    /**
     * Reset User Password with Validated Single-Use Reset Token.
     */
    public function resetPasswordWithOtp(ResetPasswordWithOtpRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $email = strtolower(trim($validated['email']));

        $consumed = $this->otpService->consumeResetToken($email, $validated['reset_token']);
        if (!$consumed) {
            return response()->json([
                'success' => false,
                'message' => 'The password reset token is invalid or has already been used. Please verify your OTP code again.',
            ], 422);
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User account not found.',
            ], 404);
        }

        $user->password = Hash::make($validated['password']);
        $user->save();

        // Dispatch security confirmation alert email
        try {
            Mail::to($user->email)->send(new PasswordResetSuccessMail($user));
        } catch (\Throwable $e) {
            Log::warning("Failed to send password reset confirmation email to {$email}: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Your password has been successfully reset. You may now sign in with your new credentials.',
        ]);
    }

    /**
     * Verify Patient Email Address with 6-digit Registration OTP Code.
     */
    public function verifyEmailOtp(VerifyOtpRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $result = $this->otpService->verifyOtp($validated['email'], $validated['otp_code'], 'email_verification');

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
        ]);
    }

    /**
     * Resend Patient Registration Email Verification OTP.
     */
    public function resendEmailOtp(SendOtpRequest $request): JsonResponse
    {
        $email = strtolower(trim($request->validated()['email']));
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Account not found.',
            ], 404);
        }

        if ($user->email_verified_at) {
            return response()->json([
                'success' => true,
                'message' => 'Your email address is already verified.',
                'already_verified' => true,
            ]);
        }

        try {
            $otp = $this->otpService->generateOtp($email, 'email_verification', 15);
            $user->load('patient');
            Mail::to($email)->send(new UserWelcomeVerificationMail($user, $user->patient, $otp, 15));
        } catch (ValidationException $ve) {
            throw $ve;
        } catch (\Throwable $e) {
            Log::error("Failed to resend registration OTP to {$email}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Unable to dispatch verification code at this moment. Please try again shortly.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => "A fresh verification code has been dispatched to {$email}.",
        ]);
    }
}
