<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\HospitalBranch;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class BranchDoctorScheduleTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * Test listing branches with province filtering.
     */
    public function test_can_list_branches_with_province_filtering(): void
    {
        $response = $this->getJson('/api/branches?province=Western Province');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('data.0.branch_name', 'Karongi Referral Hospital Branch')
            ->assertJsonPath('data.0.province', 'Western Province');
    }

    /**
     * Test fetching a single branch with departments.
     */
    public function test_can_fetch_single_branch_details(): void
    {
        $branch = HospitalBranch::where('branch_name', 'like', '%Karongi%')->first();
        $this->assertNotNull($branch);

        $response = $this->getJson("/api/branches/{$branch->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $branch->id,
                    'branch_name' => $branch->branch_name,
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'branch_name',
                    'province',
                    'district',
                    'departments',
                ],
            ]);
    }

    /**
     * Test doctor directory query with branch and specialty filters.
     */
    public function test_can_list_doctors_with_branch_and_specialty_filter(): void
    {
        $branch = HospitalBranch::where('branch_name', 'like', '%Karongi%')->first();
        $specialty = Specialty::where('specialty_name', 'Cardiology')->first();

        $response = $this->getJson("/api/doctors?branch_id={$branch->id}&specialty_id={$specialty->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('data.0.name', 'Dr. Jean-Claude Gasana')
            ->assertJsonPath('data.0.specialty_name', 'Cardiology')
            ->assertJsonPath('data.0.branch_name', $branch->branch_name);
    }

    /**
     * Test fetching single doctor profile with schedules and active days.
     */
    public function test_can_fetch_single_doctor_profile(): void
    {
        $doctor = Doctor::first();

        $response = $this->getJson("/api/doctors/{$doctor->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $doctor->id,
                    'consultation_fee' => (float)$doctor->consultation_fee,
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'branch_name',
                    'department_name',
                    'specialty_name',
                    'consultation_room',
                    'active_days',
                ],
            ]);
    }

    /**
     * Test slot generation engine generates discrete slots on a doctor's working day.
     */
    public function test_slot_engine_generates_slots_for_doctor_working_day(): void
    {
        $doctor = Doctor::where('status', 'active')->first();

        // Find next Monday
        $nextMonday = Carbon::now('Africa/Kigali')->next(Carbon::MONDAY)->format('Y-m-d');

        $response = $this->getJson("/api/doctors/{$doctor->id}/available-slots?date={$nextMonday}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'doctor_id' => $doctor->id,
                'date' => $nextMonday,
                'day_of_week' => 'monday',
                'is_working_day' => true,
                'is_on_leave' => false,
            ])
            ->assertJsonStructure([
                'slots' => [
                    '*' => ['start_time', 'end_time', 'is_available', 'is_booked'],
                ],
            ]);

        $slots = $response->json('slots');
        $this->assertNotEmpty($slots);
        $this->assertEquals('08:00', $slots[0]['start_time']);
        $this->assertEquals('08:30', $slots[0]['end_time']);
    }

    /**
     * Test slot generation engine returns unavailable on a non-working day.
     */
    public function test_slot_engine_returns_unavailable_for_non_working_day(): void
    {
        $doctor = Doctor::where('status', 'active')->first();

        // Next Sunday (not in Mon-Fri seed schedule)
        $nextSunday = Carbon::now('Africa/Kigali')->next(Carbon::SUNDAY)->format('Y-m-d');

        $response = $this->getJson("/api/doctors/{$doctor->id}/available-slots?date={$nextSunday}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'is_working_day' => false,
                'slots' => [],
            ]);
    }

    /**
     * Test slot generation engine flags already booked appointment slots.
     */
    public function test_slot_engine_marks_booked_slots_as_unavailable(): void
    {
        $doctor = Doctor::where('status', 'active')->first();
        $patient = Patient::first();
        $branch = HospitalBranch::first();

        $nextMonday = Carbon::now('Africa/Kigali')->next(Carbon::MONDAY)->format('Y-m-d');

        // Book 08:30 - 09:00 slot
        Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'branch_id' => $branch->id,
            'booking_reference' => 'BK-TEST-' . uniqid(),
            'appointment_date' => $nextMonday,
            'start_time' => '08:30:00',
            'end_time' => '09:00:00',
            'appointment_type' => 'general',
            'status' => 'confirmed',
            'reason' => 'Routine cardiology consultation',
        ]);

        $response = $this->getJson("/api/doctors/{$doctor->id}/available-slots?date={$nextMonday}");

        $response->assertStatus(200);

        $slots = collect($response->json('slots'));

        // Slot 08:00 should be available
        $slot0800 = $slots->firstWhere('start_time', '08:00');
        $this->assertNotNull($slot0800);
        $this->assertTrue($slot0800['is_available']);

        // Slot 08:30 should be booked and unavailable
        $slot0830 = $slots->firstWhere('start_time', '08:30');
        $this->assertNotNull($slot0830);
        $this->assertFalse($slot0830['is_available']);
        $this->assertTrue($slot0830['is_booked']);
        $this->assertEquals('Already booked', $slot0830['reason']);
    }

    /**
     * Test slot generation engine handles doctor on leave.
     */
    public function test_slot_engine_handles_doctor_on_leave(): void
    {
        $doctor = Doctor::where('status', 'active')->first();
        $doctor->update(['status' => 'on_leave']);

        $nextMonday = Carbon::now('Africa/Kigali')->next(Carbon::MONDAY)->format('Y-m-d');

        $response = $this->getJson("/api/doctors/{$doctor->id}/available-slots?date={$nextMonday}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'is_working_day' => false,
                'is_on_leave' => true,
                'slots' => [],
            ]);
    }

    /**
     * Test slot generation engine rejects past dates.
     */
    public function test_slot_engine_rejects_past_dates(): void
    {
        $doctor = Doctor::first();

        $response = $this->getJson("/api/doctors/{$doctor->id}/available-slots?date=2020-01-01");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['date']);
    }

    /**
     * Test doctor can update their own weekly consulting schedule.
     */
    public function test_doctor_can_update_own_schedule(): void
    {
        $doctorUser = User::where('email', 'dr.gasana@hospital.rw')->first();

        $payload = [
            'status' => 'active',
            'schedules' => [
                [
                    'day_of_week' => 'saturday',
                    'start_time' => '09:00:00',
                    'end_time' => '13:00:00',
                    'slot_duration_minutes' => 30,
                    'status' => 'active',
                ],
            ],
        ];

        $response = $this->actingAs($doctorUser, 'sanctum')
            ->putJson('/api/doctor/my-schedule', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Doctor consulting schedule updated successfully.',
            ]);

        $this->assertDatabaseHas('doctor_schedules', [
            'doctor_id' => $doctorUser->doctor->id,
            'day_of_week' => 'saturday',
            'start_time' => '09:00:00',
            'end_time' => '13:00:00',
        ]);
    }

    /**
     * Test admin can create and update hospital branches.
     */
    public function test_admin_can_manage_branches(): void
    {
        $adminUser = User::where('email', 'admin@hospital.rw')->first();

        // Create new branch
        $createRes = $this->actingAs($adminUser, 'sanctum')->postJson('/api/admin/branches', [
            'branch_name' => 'Rubavu Lakeshore Medical Center',
            'province' => 'Western Province',
            'district' => 'Rubavu',
            'location' => 'Gisenyi',
            'address' => 'Avenue de la Paix, Rubavu',
            'contact_phone' => '+250 788 123 009',
            'contact_email' => 'rubavu@hospital.rw',
        ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('data.branch_name', 'Rubavu Lakeshore Medical Center');

        $branchId = $createRes->json('data.id');

        // Update branch
        $updateRes = $this->actingAs($adminUser, 'sanctum')->putJson("/api/admin/branches/{$branchId}", [
            'branch_name' => 'Rubavu Regional Referral Center',
            'province' => 'Western Province',
            'district' => 'Rubavu',
        ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('data.branch_name', 'Rubavu Regional Referral Center');
    }
}
