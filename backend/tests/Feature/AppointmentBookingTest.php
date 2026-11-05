<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\HospitalBranch;
use App\Models\InsuranceProvider;
use App\Models\Notification;
use App\Models\Patient;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AppointmentBookingTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * Test patient can book appointment with automatic RSSB insurance co-pay calculation.
     */
    public function test_patient_can_book_appointment_with_insurance_copay_calculation(): void
    {
        $patientUser = User::where('email', 'keza.divine@gmail.com')->first();
        $doctor = Doctor::where('status', 'active')->first();
        $this->assertNotNull($doctor);

        // Next Monday
        $nextMonday = Carbon::now('Africa/Kigali')->next(Carbon::MONDAY)->format('Y-m-d');

        $response = $this->actingAs($patientUser, 'sanctum')->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'appointment_date' => $nextMonday,
            'start_time' => '09:00',
            'appointment_type' => 'specialist',
            'reason' => 'Routine cardiology consultation and blood pressure follow-up',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Appointment booked successfully.',
            ])
            ->assertJsonStructure([
                'booking_reference',
                'data' => [
                    'id',
                    'booking_reference',
                    'appointment_date',
                    'start_time',
                    'end_time',
                    'status',
                    'financial' => [
                        'has_insurance',
                        'coverage_percentage',
                        'consultation_fee',
                        'insurance_covered_amount',
                        'patient_copay_amount',
                    ],
                ],
            ]);

        $ref = $response->json('booking_reference');
        $this->assertStringStartsWith('BK-', $ref);

        // Financial assertion: RSSB coverage 85%
        $fee = (float)$doctor->consultation_fee;
        $expectedCovered = round($fee * 0.85, 2);
        $expectedCopay = round($fee - $expectedCovered, 2);

        $this->assertEquals($expectedCovered, (float)$response->json('data.financial.insurance_covered_amount'));
        $this->assertEquals($expectedCopay, (float)$response->json('data.financial.patient_copay_amount'));

        // Notification assertion
        $this->assertDatabaseHas('notifications', [
            'user_id' => $patientUser->id,
            'notification_type' => 'appointment',
        ]);
    }

    /**
     * Test system strictly prevents double booking on the same doctor time slot.
     */
    public function test_booking_prevents_double_booking_on_same_slot(): void
    {
        $patient1 = User::where('email', 'keza.divine@gmail.com')->first();
        $patient2 = User::where('email', 'kwizera.aime@gmail.com')->first();
        $doctor = Doctor::where('status', 'active')->first();

        $nextMonday = Carbon::now('Africa/Kigali')->next(Carbon::MONDAY)->format('Y-m-d');

        // First patient books 09:30
        $res1 = $this->actingAs($patient1, 'sanctum')->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'appointment_date' => $nextMonday,
            'start_time' => '09:30',
            'reason' => 'First patient reservation',
        ]);
        $res1->assertStatus(201);

        // Second patient attempts to book identical slot
        $res2 = $this->actingAs($patient2, 'sanctum')->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'appointment_date' => $nextMonday,
            'start_time' => '09:30',
            'reason' => 'Conflicting patient reservation attempt',
        ]);

        $res2->assertStatus(422)
            ->assertJsonValidationErrors(['start_time']);
    }

    /**
     * Test booking fails on a day the doctor is not on duty.
     */
    public function test_booking_fails_on_doctor_non_working_day(): void
    {
        $patient = User::where('email', 'keza.divine@gmail.com')->first();
        $doctor = Doctor::where('status', 'active')->first();

        // Next Sunday (off duty)
        $nextSunday = Carbon::now('Africa/Kigali')->next(Carbon::SUNDAY)->format('Y-m-d');

        $response = $this->actingAs($patient, 'sanctum')->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'appointment_date' => $nextSunday,
            'start_time' => '10:00',
            'reason' => 'Sunday consultation attempt',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['appointment_date']);
    }

    /**
     * Test booking fails when doctor is marked on leave.
     */
    public function test_booking_fails_when_doctor_on_leave(): void
    {
        $patient = User::where('email', 'keza.divine@gmail.com')->first();
        $doctor = Doctor::where('status', 'active')->first();
        $doctor->update(['status' => 'on_leave']);

        $nextMonday = Carbon::now('Africa/Kigali')->next(Carbon::MONDAY)->format('Y-m-d');

        $response = $this->actingAs($patient, 'sanctum')->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'appointment_date' => $nextMonday,
            'start_time' => '10:00',
            'reason' => 'Consultation while doctor is away',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['doctor_id']);
    }

    /**
     * Test patients can only view their own appointments (tenant isolation).
     */
    public function test_patient_can_list_only_own_appointments(): void
    {
        $patient1 = User::where('email', 'keza.divine@gmail.com')->first();
        $patient2 = User::where('email', 'kwizera.aime@gmail.com')->first();
        $doctor = Doctor::where('status', 'active')->first();

        $nextMonday = Carbon::now('Africa/Kigali')->next(Carbon::MONDAY)->format('Y-m-d');

        // Book for patient 2
        $this->actingAs($patient2, 'sanctum')->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'appointment_date' => $nextMonday,
            'start_time' => '11:00',
            'reason' => 'Patient 2 private visit',
        ]);

        // Patient 1 lists appointments
        $response = $this->actingAs($patient1, 'sanctum')->getJson('/api/appointments');

        $response->assertStatus(200);
        $patientIds = collect($response->json('data'))->pluck('patient.id')->unique();

        // Must contain either empty or only patient1's ID
        foreach ($patientIds as $id) {
            $this->assertEquals($patient1->patient->id, $id);
        }
    }

    /**
     * Test doctor can confirm and complete appointments with clinical notes.
     */
    public function test_doctor_can_confirm_and_complete_appointment(): void
    {
        $patient = User::where('email', 'keza.divine@gmail.com')->first();
        $doctorUser = User::where('email', 'dr.gasana@hospital.rw')->first();
        $doctor = $doctorUser->doctor;

        $nextMonday = Carbon::now('Africa/Kigali')->next(Carbon::MONDAY)->format('Y-m-d');

        // Book appointment
        $bookRes = $this->actingAs($patient, 'sanctum')->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'appointment_date' => $nextMonday,
            'start_time' => '14:00',
            'reason' => 'Chest pain assessment',
        ]);
        $apptId = $bookRes->json('data.id');

        // 1. Doctor confirms appointment
        $confirmRes = $this->actingAs($doctorUser, 'sanctum')
            ->putJson("/api/appointments/{$apptId}/status", [
                'status' => 'confirmed',
                'notes' => 'Confirmed by attending physician',
            ]);

        $confirmRes->assertStatus(200)
            ->assertJsonPath('data.status', 'confirmed');

        // 2. Doctor completes appointment
        $completeRes = $this->actingAs($doctorUser, 'sanctum')
            ->putJson("/api/appointments/{$apptId}/status", [
                'status' => 'completed',
                'notes' => 'Consultation completed. Patient advised rest and Coartem prescription.',
            ]);

        $completeRes->assertStatus(200)
            ->assertJsonPath('data.status', 'completed');
    }

    /**
     * Test completed appointments cannot have their status altered.
     */
    public function test_completed_appointment_status_cannot_be_reverted(): void
    {
        $doctorUser = User::where('email', 'dr.gasana@hospital.rw')->first();
        $patient = Patient::first();
        $branch = HospitalBranch::first();

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctorUser->doctor->id,
            'branch_id' => $branch->id,
            'booking_reference' => 'BK-CMP-' . uniqid(),
            'appointment_date' => Carbon::yesterday()->format('Y-m-d'),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'status' => 'completed',
            'reason' => 'Completed session',
        ]);

        $response = $this->actingAs($doctorUser, 'sanctum')
            ->putJson("/api/appointments/{$appointment->id}/status", [
                'status' => 'cancelled',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    /**
     * Test patient can cancel appointment and the slot becomes available again.
     */
    public function test_patient_can_cancel_appointment_and_free_slot(): void
    {
        $patient = User::where('email', 'keza.divine@gmail.com')->first();
        $doctor = Doctor::where('status', 'active')->first();

        $nextMonday = Carbon::now('Africa/Kigali')->next(Carbon::MONDAY)->format('Y-m-d');

        // Book slot 15:00
        $bookRes = $this->actingAs($patient, 'sanctum')->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'appointment_date' => $nextMonday,
            'start_time' => '15:00',
            'reason' => 'Booking before cancellation',
        ]);
        $apptId = $bookRes->json('data.id');

        // Cancel appointment
        $cancelRes = $this->actingAs($patient, 'sanctum')
            ->putJson("/api/appointments/{$apptId}/status", [
                'status' => 'cancelled',
                'cancellation_reason' => 'Work schedule conflict',
            ]);

        $cancelRes->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled');

        // Verify slot is now free in dynamic slot engine
        $slotsRes = $this->getJson("/api/doctors/{$doctor->id}/available-slots?date={$nextMonday}");
        $slot1500 = collect($slotsRes->json('slots'))->firstWhere('start_time', '15:00');

        $this->assertNotNull($slot1500);
        $this->assertTrue($slot1500['is_available']);
        $this->assertFalse($slot1500['is_booked']);
    }

    /**
     * Test patient can reschedule an appointment to a new date and time slot.
     */
    public function test_patient_can_reschedule_appointment(): void
    {
        $patient = User::where('email', 'keza.divine@gmail.com')->first();
        $doctor = Doctor::where('status', 'active')->first();

        $nextMonday = Carbon::now('Africa/Kigali')->next(Carbon::MONDAY)->format('Y-m-d');
        $nextTuesday = Carbon::now('Africa/Kigali')->next(Carbon::TUESDAY)->format('Y-m-d');

        // Book initial appointment on Monday
        $bookRes = $this->actingAs($patient, 'sanctum')->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'appointment_date' => $nextMonday,
            'start_time' => '10:00',
            'reason' => 'Initial appointment',
        ]);
        $apptId = $bookRes->json('data.id');

        // Reschedule to Tuesday 11:00
        $rescheduleRes = $this->actingAs($patient, 'sanctum')
            ->putJson("/api/appointments/{$apptId}/reschedule", [
                'appointment_date' => $nextTuesday,
                'start_time' => '11:00',
                'reason' => 'Moving to Tuesday due to travel',
            ]);

        $rescheduleRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Appointment rescheduled successfully.',
            ])
            ->assertJsonPath('data.appointment_date', $nextTuesday)
            ->assertJsonPath('data.start_time', '11:00');
    }

    /**
     * Test emergency triage intake creates high-priority appointment and staff alert.
     */
    public function test_emergency_triage_creates_priority_appointment_and_alert(): void
    {
        $patient = User::where('email', 'keza.divine@gmail.com')->first();
        $branch = HospitalBranch::where('branch_name', 'like', '%Karongi%')->first();

        $response = $this->actingAs($patient, 'sanctum')->postJson('/api/emergency/triage-intake', [
            'branch_id' => $branch->id,
            'triage_level' => 'level_1_resuscitation',
            'symptoms' => 'Severe acute respiratory distress and cyanosis',
            'vital_signs' => [
                'blood_pressure' => '85/50',
                'heart_rate' => 140,
                'temperature' => 38.9,
                'spo2' => 84,
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'triage_level' => 'LEVEL 1 RESUSCITATION',
            ])
            ->assertJsonPath('data.is_emergency', true)
            ->assertJsonPath('data.status', 'confirmed');

        $queueToken = $response->json('queue_token');
        $this->assertStringStartsWith('EMG-', $queueToken);

        // High priority notification created
        $this->assertDatabaseHas('notifications', [
            'title' => '🚨 EMERGENCY TRIAGE: LEVEL 1 RESUSCITATION',
        ]);
    }
}
