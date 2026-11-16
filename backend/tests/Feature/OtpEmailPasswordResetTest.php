<?php

namespace Tests\Feature;

use App\Mail\PasswordResetOtpMail;
use App\Mail\PasswordResetSuccessMail;
use App\Mail\UserWelcomeVerificationMail;
use App\Models\InsuranceProvider;
use App\Models\OtpVerification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OtpEmailPasswordResetTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * Test registration dispatches welcome email with OTP and returns patient number.
     */
    public function test_registration_dispatches_welcome_email_with_otp_and_patient_id(): void
    {
        Mail::fake();

        $insurance = InsuranceProvider::first();

        $payload = [
            'name' => 'Gisele Ishimwe',
            'email' => 'gisele.ishimwe@test.rw',
            'phone' => '+250788776655',
            'password' => 'SecurePass2026!',
            'password_confirmation' => 'SecurePass2026!',
            'dob' => '1999-08-20',
            'gender' => 'female',
            'national_id' => '1199970011223344',
            'address' => 'Kigali, Nyarugenge, Kiyovu',
            'emergency_contact_name' => 'Pauline Umutoni',
            'emergency_contact_phone' => '+250788665544',
            'insurance_provider_id' => $insurance?->id,
            'insurance_number' => 'RAMA-99887766',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'otp_sent' => true,
            ]);

        $this->assertNotEmpty($response->json('patient_number'));

        // Assert OTP stored in database
        $this->assertDatabaseHas('otp_verifications', [
            'email' => 'gisele.ishimwe@test.rw',
            'type' => 'email_verification',
        ]);

        // Assert UserWelcomeVerificationMail was queued/sent
        Mail::assertSent(UserWelcomeVerificationMail::class, function ($mail) {
            return $mail->hasTo('gisele.ishimwe@test.rw') && strlen($mail->otpCode) === 6;
        });
    }

    /**
     * Test forgot password sends OTP for an existing active user.
     */
    public function test_forgot_password_sends_otp_for_registered_user(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'email' => 'doctor.test@hospital.rw',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/auth/forgot-password/send-otp', [
            'email' => 'doctor.test@hospital.rw',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('otp_verifications', [
            'email' => 'doctor.test@hospital.rw',
            'type' => 'password_reset',
        ]);

        Mail::assertSent(PasswordResetOtpMail::class, function ($mail) {
            return $mail->hasTo('doctor.test@hospital.rw') && strlen($mail->otpCode) === 6;
        });
    }

    /**
     * Test forgot password fails with 404 for non-existent email.
     */
    public function test_forgot_password_fails_for_nonexistent_email(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/auth/forgot-password/send-otp', [
            'email' => 'nonexistent.user@random.rw',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
            ]);

        Mail::assertNothingSent();
    }

    /**
     * Test verifying correct OTP issues a single-use reset token.
     */
    public function test_verify_otp_succeeds_and_issues_reset_token(): void
    {
        $email = 'reset.verify@hospital.rw';
        $code = '654321';

        OtpVerification::create([
            'email' => $email,
            'otp_code' => $code,
            'type' => 'password_reset',
            'expires_at' => Carbon::now()->addMinutes(10),
            'attempts' => 0,
        ]);

        $response = $this->postJson('/api/auth/forgot-password/verify-otp', [
            'email' => $email,
            'otp_code' => $code,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'reset_token',
            ]);

        $this->assertEquals(64, strlen($response->json('reset_token')));
    }

    /**
     * Test verifying incorrect OTP increments attempts and fails.
     */
    public function test_verify_otp_fails_with_incorrect_code(): void
    {
        $email = 'wrong.code@hospital.rw';

        $otp = OtpVerification::create([
            'email' => $email,
            'otp_code' => '123456',
            'type' => 'password_reset',
            'expires_at' => Carbon::now()->addMinutes(10),
            'attempts' => 0,
        ]);

        $response = $this->postJson('/api/auth/forgot-password/verify-otp', [
            'email' => $email,
            'otp_code' => '999999',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        $this->assertEquals(1, $otp->fresh()->attempts);
    }

    /**
     * Test verifying expired OTP fails.
     */
    public function test_verify_otp_fails_when_expired(): void
    {
        $email = 'expired.code@hospital.rw';

        OtpVerification::create([
            'email' => $email,
            'otp_code' => '123456',
            'type' => 'password_reset',
            'expires_at' => Carbon::now()->subMinutes(5), // expired
            'attempts' => 0,
        ]);

        $response = $this->postJson('/api/auth/forgot-password/verify-otp', [
            'email' => $email,
            'otp_code' => '123456',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    /**
     * Test reset password with valid token updates user password and sends confirmation email.
     */
    public function test_reset_password_updates_user_password_and_invalidates_token(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'email' => 'change.my.password@hospital.rw',
            'password' => Hash::make('OldPassword123!'),
        ]);

        $token = bin2hex(random_bytes(32));

        OtpVerification::create([
            'email' => $user->email,
            'otp_code' => '112233',
            'type' => 'password_reset',
            'expires_at' => Carbon::now()->addMinutes(10),
            'verified_at' => Carbon::now(),
            'reset_token' => $token,
        ]);

        $response = $this->postJson('/api/auth/forgot-password/reset', [
            'email' => $user->email,
            'reset_token' => $token,
            'password' => 'BrandNewPassword2026!',
            'password_confirmation' => 'BrandNewPassword2026!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // Verify password updated in DB
        $this->assertTrue(Hash::check('BrandNewPassword2026!', $user->fresh()->password));

        // Verify token was invalidated / consumed
        $this->assertDatabaseMissing('otp_verifications', [
            'email' => $user->email,
            'reset_token' => $token,
        ]);

        // Verify security alert email was sent
        Mail::assertSent(PasswordResetSuccessMail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email);
        });
    }

    /**
     * Test reset password fails when attempting to reuse the same token.
     */
    public function test_reset_password_cannot_be_reused_with_same_token(): void
    {
        $user = User::factory()->create([
            'email' => 'reuse.token@hospital.rw',
            'password' => Hash::make('InitialPass123!'),
        ]);

        $token = bin2hex(random_bytes(32));

        OtpVerification::create([
            'email' => $user->email,
            'otp_code' => '445566',
            'type' => 'password_reset',
            'expires_at' => Carbon::now()->addMinutes(10),
            'verified_at' => Carbon::now(),
            'reset_token' => $token,
        ]);

        // First reset succeeds
        $firstResponse = $this->postJson('/api/auth/forgot-password/reset', [
            'email' => $user->email,
            'reset_token' => $token,
            'password' => 'NewPasswordOnce1!',
            'password_confirmation' => 'NewPasswordOnce1!',
        ]);
        $firstResponse->assertStatus(200);

        // Second reset with same token must fail with 422
        $secondResponse = $this->postJson('/api/auth/forgot-password/reset', [
            'email' => $user->email,
            'reset_token' => $token,
            'password' => 'AttemptReusePassword2!',
            'password_confirmation' => 'AttemptReusePassword2!',
        ]);
        $secondResponse->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    /**
     * Test patient can verify email address using registration OTP.
     */
    public function test_user_can_verify_email_using_otp(): void
    {
        $user = User::factory()->create([
            'email' => 'patient.unverified@hospital.rw',
            'email_verified_at' => null,
        ]);

        OtpVerification::create([
            'email' => $user->email,
            'otp_code' => '889900',
            'type' => 'email_verification',
            'expires_at' => Carbon::now()->addMinutes(15),
            'attempts' => 0,
        ]);

        $response = $this->postJson('/api/auth/verify-email-otp', [
            'email' => $user->email,
            'otp_code' => '889900',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertNotNull($user->fresh()->email_verified_at);
    }
}
