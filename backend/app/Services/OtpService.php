<?php

namespace App\Services;

use App\Models\OtpVerification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class OtpService
{
    /**
     * Generate and store a secure 6-digit OTP with rate limiting.
     *
     * @throws ValidationException
     */
    public function generateOtp(string $email, string $type = 'password_reset', int $lifetimeMinutes = 10): string
    {
        $normalizedEmail = strtolower(trim($email));

        // 1. Rate Limiting: enforce 60-second cooldown between OTP generations
        $recentOtp = OtpVerification::where('email', $normalizedEmail)
            ->where('type', $type)
            ->where('created_at', '>', Carbon::now()->subSeconds(60))
            ->first();

        if ($recentOtp) {
            $secondsRemaining = 60 - Carbon::now()->diffInSeconds($recentOtp->created_at);
            throw ValidationException::withMessages([
                'email' => ["A security code was recently requested. Please wait {$secondsRemaining} seconds before requesting a new code."],
            ]);
        }

        // 2. Invalidate any existing active unverified OTPs for this email and type
        OtpVerification::where('email', $normalizedEmail)
            ->where('type', $type)
            ->whereNull('verified_at')
            ->delete();

        // 3. Generate cryptographically secure 6-digit code
        $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        // 4. Persist to database
        OtpVerification::create([
            'email' => $normalizedEmail,
            'otp_code' => $code,
            'type' => $type,
            'expires_at' => Carbon::now()->addMinutes($lifetimeMinutes),
            'attempts' => 0,
        ]);

        return $code;
    }

    /**
     * Verify a 6-digit OTP code.
     */
    public function verifyOtp(string $email, string $code, string $type = 'password_reset'): array
    {
        $normalizedEmail = strtolower(trim($email));

        $record = OtpVerification::where('email', $normalizedEmail)
            ->where('type', $type)
            ->whereNull('verified_at')
            ->latest()
            ->first();

        if (!$record) {
            return [
                'success' => false,
                'message' => 'No active verification code found for this email. Please request a new code.',
            ];
        }

        if ($record->isLocked()) {
            return [
                'success' => false,
                'message' => 'Too many failed verification attempts. Please request a new security code.',
            ];
        }

        if ($record->isExpired()) {
            return [
                'success' => false,
                'message' => 'The verification code has expired. Please request a new code.',
            ];
        }

        if (trim($code) !== $record->otp_code) {
            $record->increment('attempts');
            $remaining = max(0, 5 - $record->attempts);
            return [
                'success' => false,
                'message' => "Invalid 6-digit code. {$remaining} attempts remaining.",
            ];
        }

        // Successfully verified
        $record->verified_at = Carbon::now();

        if ($type === 'password_reset') {
            $resetToken = bin2hex(random_bytes(32)); // 64 hex characters
            $record->reset_token = $resetToken;
            $record->save();

            return [
                'success' => true,
                'reset_token' => $resetToken,
                'message' => 'Security code verified successfully. You may now set your new password.',
            ];
        }

        if ($type === 'email_verification') {
            $record->save();

            // Mark user email as verified
            User::where('email', $normalizedEmail)->update([
                'email_verified_at' => Carbon::now(),
            ]);

            return [
                'success' => true,
                'message' => 'Email address verified successfully. Welcome to Healthcare System Rwanda!',
            ];
        }

        $record->save();
        return [
            'success' => true,
            'message' => 'Verification successful.',
        ];
    }

    /**
     * Validate and consume a single-use password reset token.
     */
    public function consumeResetToken(string $email, string $token): bool
    {
        $normalizedEmail = strtolower(trim($email));

        $record = OtpVerification::where('email', $normalizedEmail)
            ->where('type', 'password_reset')
            ->where('reset_token', $token)
            ->whereNotNull('verified_at')
            ->where('created_at', '>', Carbon::now()->subMinutes(30))
            ->first();

        if (!$record) {
            return false;
        }

        // Invalidate token so it cannot be used again
        $record->reset_token = null;
        $record->save();

        return true;
    }
}
