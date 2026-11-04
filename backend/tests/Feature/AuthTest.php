<?php

namespace Tests\Feature;

use App\Models\InsuranceProvider;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * Test successful patient self-registration with complete Rwandan demographics.
     */
    public function test_patient_can_register_successfully(): void
    {
        $insurance = InsuranceProvider::first();

        $payload = [
            'name' => 'Jean-Paul Nsengiyumva',
            'email' => 'jeanpaul.test@gmail.com',
            'phone' => '+250788112233',
            'password' => 'SecurePass2026!',
            'password_confirmation' => 'SecurePass2026!',
            'dob' => '1995-04-12',
            'gender' => 'male',
            'national_id' => '1199580012345678',
            'address' => 'Karongi, Western Province, Bwishyura',
            'emergency_contact_name' => 'Chantal Mukamana',
            'emergency_contact_phone' => '+250788998877',
            'insurance_provider_id' => $insurance ? $insurance->id : null,
            'insurance_number' => 'RSSB-2026-98765',
            'allergies' => 'Penicillin allergy',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Registration successful! Welcome to Healthcare System Rwanda.',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'token',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'phone',
                    'role',
                    'status',
                    'patient' => [
                        'patient_number',
                        'dob',
                        'gender',
                        'national_id',
                        'address',
                        'emergency_contact_name',
                        'emergency_contact_phone',
                        'insurance_number',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'jeanpaul.test@gmail.com',
            'role' => 'patient',
        ]);

        $this->assertDatabaseHas('patients', [
            'national_id' => '1199580012345678',
            'emergency_contact_name' => 'Chantal Mukamana',
        ]);
    }

    /**
     * Test registration failure when phone is not a valid Rwandan format.
     */
    public function test_registration_fails_with_invalid_phone(): void
    {
        $payload = [
            'name' => 'Test User',
            'email' => 'invalid.phone@test.com',
            'phone' => '12345', // invalid phone
            'password' => 'SecurePass2026!',
            'password_confirmation' => 'SecurePass2026!',
            'dob' => '1990-01-01',
            'gender' => 'female',
            'address' => 'Kigali, Rwanda',
            'emergency_contact_name' => 'Emergency Contact',
            'emergency_contact_phone' => '+250788000000',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);
    }

    /**
     * Test registration fails with weak password lacking uppercase, number, or special character.
     */
    public function test_registration_fails_with_weak_password(): void
    {
        $payload = [
            'name' => 'Weak Pass User',
            'email' => 'weak.pass@test.com',
            'phone' => '+250788123456',
            'password' => 'simplepassword',
            'password_confirmation' => 'simplepassword',
            'dob' => '1992-06-15',
            'gender' => 'male',
            'address' => 'Musanze, Rwanda',
            'emergency_contact_name' => 'Contact Person',
            'emergency_contact_phone' => '+250788223344',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /**
     * Test login succeeds for seeded accounts across key roles.
     */
    public function test_login_succeeds_with_valid_credentials(): void
    {
        // Admin
        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@hospital.rw',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Login successful.',
            ])
            ->assertJsonPath('user.role', 'admin');

        $this->assertNotEmpty($response->json('token'));

        // Doctor
        $docResponse = $this->postJson('/api/auth/login', [
            'email' => 'dr.gasana@hospital.rw',
            'password' => 'Password123!',
        ]);

        $docResponse->assertStatus(200)
            ->assertJsonPath('user.role', 'doctor')
            ->assertJsonStructure(['user' => ['doctor' => ['branch', 'department', 'specialty']]]);

        // Patient
        $patResponse = $this->postJson('/api/auth/login', [
            'email' => 'keza.divine@gmail.com',
            'password' => 'Password123!',
        ]);

        $patResponse->assertStatus(200)
            ->assertJsonPath('user.role', 'patient');
    }

    /**
     * Test login fails with invalid credentials.
     */
    public function test_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@hospital.rw',
            'password' => 'WrongPassword!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test fetching currently authenticated user via /api/auth/me.
     */
    public function test_authenticated_user_can_fetch_profile(): void
    {
        $user = User::where('email', 'dr.gasana@hospital.rw')->first();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'user' => [
                    'email' => 'dr.gasana@hospital.rw',
                    'role' => 'doctor',
                ],
            ]);
    }

    /**
     * Test updating patient demographics and medical info via /api/auth/profile.
     */
    public function test_patient_can_update_profile(): void
    {
        $user = User::where('email', 'keza.divine@gmail.com')->first();

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/auth/profile', [
            'name' => 'Divine Keza Updated',
            'phone' => '+250788334455',
            'address' => 'Kigali, Nyarugenge, Kiyovu',
            'emergency_contact_name' => 'Aline Keza',
            'emergency_contact_phone' => '+250788556677',
            'allergies' => 'Aspirin, Ibuprofen',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Profile updated successfully.',
            ])
            ->assertJsonPath('user.name', 'Divine Keza Updated')
            ->assertJsonPath('user.phone', '+250788334455')
            ->assertJsonPath('user.patient.allergies', 'Aspirin, Ibuprofen');
    }

    /**
     * Test user can change password with current password verification.
     */
    public function test_user_can_change_password(): void
    {
        $user = User::where('email', 'keza.divine@gmail.com')->first();

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/auth/password', [
            'current_password' => 'Password123!',
            'new_password' => 'NewSecretPassword2026#',
            'new_password_confirmation' => 'NewSecretPassword2026#',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Password changed successfully.',
            ]);

        // Verify new password is valid
        $user->refresh();
        $this->assertTrue(Hash::check('NewSecretPassword2026#', $user->password));
    }

    /**
     * Test changing password fails when current password is wrong.
     */
    public function test_change_password_fails_with_wrong_current_password(): void
    {
        $user = User::where('email', 'keza.divine@gmail.com')->first();

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/auth/password', [
            'current_password' => 'WrongCurrentPassword123!',
            'new_password' => 'NewSecretPassword2026#',
            'new_password_confirmation' => 'NewSecretPassword2026#',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    /**
     * Test avatar upload with valid JPEG/PNG and rejection of >2MB files.
     */
    public function test_avatar_upload_and_size_validation(): void
    {
        Storage::fake('public');
        $user = User::where('email', 'admin@hospital.rw')->first();

        // 1. Valid image upload (under 2MB)
        $validImage = UploadedFile::fake()->image('avatar.jpg', 400, 400)->size(500); // 500 KB

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/auth/avatar', [
            'avatar' => $validImage,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Profile photograph uploaded successfully.',
            ]);

        $user->refresh();
        $this->assertNotNull($user->avatar_url);
        Storage::disk('public')->assertExists($user->avatar_url);

        // 2. Reject file over 2MB (2500 KB)
        $oversizedImage = UploadedFile::fake()->image('big_avatar.png', 2000, 2000)->size(2500);

        $failResponse = $this->actingAs($user, 'sanctum')->postJson('/api/auth/avatar', [
            'avatar' => $oversizedImage,
        ]);

        $failResponse->assertStatus(422)
            ->assertJsonValidationErrors(['avatar']);
    }

    /**
     * Test logout revokes active bearer token.
     */
    public function test_user_can_logout_and_revoke_token(): void
    {
        // Login to get token
        $loginRes = $this->postJson('/api/auth/login', [
            'email' => 'admin@hospital.rw',
            'password' => 'Password123!',
        ]);

        $token = $loginRes->json('token');

        // Logout with Bearer token
        $logoutRes = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/auth/logout');

        $logoutRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Successfully logged out.',
            ]);

        // Clear auth guards cache
        $this->app['auth']->forgetGuards();

        // Attempting to access protected route should now fail with 401
        $meRes = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/auth/me');

        $meRes->assertStatus(401);
    }
}
