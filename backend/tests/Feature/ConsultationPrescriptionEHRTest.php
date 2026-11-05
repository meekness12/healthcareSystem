<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Medicine;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ConsultationPrescriptionEHRTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * Test doctor can search and filter medicine catalogue.
     */
    public function test_doctor_can_search_and_list_medicines(): void
    {
        $doctorUser = User::where('role', 'doctor')->first();
        $this->assertNotNull($doctorUser);

        // 1. Search by name
        $response = $this->actingAs($doctorUser, 'sanctum')->getJson('/api/medicines?q=Paracetamol');
        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonFragment(['medicine_name' => 'Paracetamol']);

        // 2. Filter by category
        $responseCat = $this->actingAs($doctorUser, 'sanctum')->getJson('/api/medicines?category=Antibiotic');
        $responseCat->assertStatus(200)
            ->assertJson(['success' => true]);

        // 3. List categories
        $responseCategories = $this->actingAs($doctorUser, 'sanctum')->getJson('/api/medicines/categories');
        $responseCategories->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    /**
     * Test doctor can create consultation encounter and transition appointment to completed.
     */
    public function test_doctor_can_create_consultation_and_complete_appointment(): void
    {
        $doctorUser = User::where('role', 'doctor')->first();
        $doctor = $doctorUser->doctor;
        $patient = Patient::first();

        // Create a confirmed appointment
        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'branch_id' => $doctor->branch_id,
            'booking_reference' => 'APT-TEST-' . rand(1000, 9999),
            'appointment_date' => Carbon::now('Africa/Kigali')->format('Y-m-d'),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'appointment_type' => 'general',
            'is_emergency' => false,
            'status' => 'confirmed',
            'reason' => 'Severe headaches and dizziness',
        ]);

        $response = $this->actingAs($doctorUser, 'sanctum')->postJson('/api/consultations', [
            'appointment_id' => $appointment->id,
            'symptoms' => 'Persistent occipital throbbing headache, blurred vision, mild nausea.',
            'diagnosis' => 'Essential Hypertension Stage 1 with tension headache',
            'consultation_notes' => 'Patient advised lifestyle modification, salt intake restriction, daily blood pressure monitoring.',
            'treatment_plan' => 'Start Amlodipine 5mg OD, follow up in 2 weeks.',
            'vitals' => [
                'heart_rate' => 76,
                'blood_pressure_systolic' => 145,
                'blood_pressure_diastolic' => 92,
                'temperature' => 36.8,
                'spo2' => 98,
                'weight_kg' => 72.5,
            ],
            'follow_up_date' => Carbon::now('Africa/Kigali')->addWeeks(2)->format('Y-m-d'),
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Clinical consultation completed and appointment closed successfully.',
            ])
            ->assertJsonPath('data.diagnosis', 'Essential Hypertension Stage 1 with tension headache')
            ->assertJsonPath('data.vitals.blood_pressure_systolic', 145);

        // Verify appointment transitioned to completed
        $appointment->refresh();
        $this->assertEquals('completed', $appointment->status);
    }

    /**
     * Test consultation creation with embedded multi-item electronic prescription.
     */
    public function test_consultation_creation_issues_multi_item_prescription(): void
    {
        $doctorUser = User::where('role', 'doctor')->first();
        $doctor = $doctorUser->doctor;
        $patient = Patient::first();

        $med1 = Medicine::where('medicine_name', 'like', '%Paracetamol%')->first();
        $med2 = Medicine::where('medicine_name', 'like', '%Amoxicillin%')->first();
        $this->assertNotNull($med1);
        $this->assertNotNull($med2);

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'branch_id' => $doctor->branch_id,
            'booking_reference' => 'APT-TEST-' . rand(1000, 9999),
            'appointment_date' => Carbon::now('Africa/Kigali')->format('Y-m-d'),
            'start_time' => '11:00:00',
            'end_time' => '11:30:00',
            'appointment_type' => 'general',
            'is_emergency' => false,
            'status' => 'confirmed',
            'reason' => 'Acute pharyngitis',
        ]);

        $response = $this->actingAs($doctorUser, 'sanctum')->postJson('/api/consultations', [
            'appointment_id' => $appointment->id,
            'symptoms' => 'Sore throat, difficulty swallowing, fever 38.5C',
            'diagnosis' => 'Acute Bacterial Streptococcal Pharyngitis',
            'consultation_notes' => 'Tonsillar exudate noted upon examination.',
            'treatment_plan' => 'Complete full 5-day antibiotic regimen.',
            'prescription' => [
                'instructions' => 'Take all tablets after meals with abundant water.',
                'items' => [
                    [
                        'medicine_id' => $med1->id,
                        'dosage' => '500mg',
                        'frequency' => 'Three times daily (TID)',
                        'duration_days' => 3,
                        'quantity_prescribed' => 9,
                        'instructions' => 'Take 1 tablet every 8 hours for pain and fever.',
                    ],
                    [
                        'medicine_id' => $med2->id,
                        'dosage' => '500mg',
                        'frequency' => 'Three times daily (TID)',
                        'duration_days' => 5,
                        'quantity_prescribed' => 15,
                        'instructions' => 'Do not discontinue early even if symptoms resolve.',
                    ],
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('data.prescriptions.0.status', 'issued')
            ->assertJsonPath('data.prescriptions.0.total_items_count', 2);

        // Verify database records
        $this->assertDatabaseHas('prescriptions', [
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'status' => 'issued',
        ]);

        $this->assertDatabaseHas('prescription_items', [
            'medicine_id' => $med1->id,
            'quantity_prescribed' => 9,
        ]);
    }

    /**
     * Test standalone prescription issuance for an existing consultation.
     */
    public function test_standalone_prescription_can_be_issued(): void
    {
        $doctorUser = User::where('role', 'doctor')->first();
        $doctor = $doctorUser->doctor;
        $patient = Patient::first();
        $med = Medicine::first();

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'branch_id' => $doctor->branch_id,
            'booking_reference' => 'APT-TEST-' . rand(1000, 9999),
            'appointment_date' => Carbon::now('Africa/Kigali')->format('Y-m-d'),
            'start_time' => '14:00:00',
            'end_time' => '14:30:00',
            'appointment_type' => 'general',
            'status' => 'confirmed',
            'reason' => 'Checkup',
        ]);

        $consultation = Consultation::create([
            'appointment_id' => $appointment->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'symptoms' => 'Cough',
            'diagnosis' => 'Acute Bronchitis',
        ]);

        $response = $this->actingAs($doctorUser, 'sanctum')->postJson('/api/prescriptions', [
            'consultation_id' => $consultation->id,
            'instructions' => 'Follow oral administration instructions.',
            'items' => [
                [
                    'medicine_id' => $med->id,
                    'dosage' => '1 tablet',
                    'frequency' => 'Once daily (OD)',
                    'duration_days' => 7,
                    'quantity_prescribed' => 7,
                    'instructions' => 'Take in the morning',
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.items.0.quantity_prescribed', 7);
    }

    /**
     * Test patient cannot create clinical consultations.
     */
    public function test_patient_cannot_create_consultation(): void
    {
        $patientUser = User::where('role', 'patient')->first();
        $patient = $patientUser->patient;
        $doctor = Doctor::first();

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'branch_id' => $doctor->branch_id,
            'booking_reference' => 'APT-TEST-' . rand(1000, 9999),
            'appointment_date' => Carbon::now('Africa/Kigali')->addDays(4)->format('Y-m-d'),
            'start_time' => '16:00:00',
            'end_time' => '16:30:00',
            'appointment_type' => 'general',
            'status' => 'confirmed',
            'reason' => 'Checkup',
        ]);

        $response = $this->actingAs($patientUser, 'sanctum')->postJson('/api/consultations', [
            'appointment_id' => $appointment->id,
            'symptoms' => 'Self diagnosed illness',
            'diagnosis' => 'Fake diagnosis',
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test prescription requires valid existing medicine.
     */
    public function test_prescription_requires_valid_medicine_ids(): void
    {
        $doctorUser = User::where('role', 'doctor')->first();
        $doctor = $doctorUser->doctor;
        $patient = Patient::first();

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'branch_id' => $doctor->branch_id,
            'booking_reference' => 'APT-TEST-' . rand(1000, 9999),
            'appointment_date' => Carbon::now('Africa/Kigali')->format('Y-m-d'),
            'start_time' => '15:00:00',
            'end_time' => '15:30:00',
            'appointment_type' => 'general',
            'status' => 'confirmed',
            'reason' => 'Checkup',
        ]);

        $consultation = Consultation::create([
            'appointment_id' => $appointment->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'symptoms' => 'Fever',
            'diagnosis' => 'Malaria',
        ]);

        $response = $this->actingAs($doctorUser, 'sanctum')->postJson('/api/prescriptions', [
            'consultation_id' => $consultation->id,
            'items' => [
                [
                    'medicine_id' => 999999, // Non-existent medicine
                    'dosage' => '500mg',
                    'frequency' => 'BID',
                    'duration_days' => 5,
                    'quantity_prescribed' => 10,
                ],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.medicine_id']);
    }

    /**
     * Test patient can view own consultation history and cannot view others.
     */
    public function test_patient_can_view_only_own_consultation_history(): void
    {
        $patient1 = Patient::first();
        $patient1User = $patient1->user;

        $patient2 = Patient::where('id', '!=', $patient1->id)->first();
        $this->assertNotNull($patient2);

        // 1. Patient 1 views own history -> 200 OK
        $responseOwn = $this->actingAs($patient1User, 'sanctum')->getJson("/api/patients/{$patient1->id}/consultation-history");
        $responseOwn->assertStatus(200)
            ->assertJson(['success' => true]);

        // 2. Patient 1 attempts to view Patient 2 history -> 403 Forbidden
        $responseOther = $this->actingAs($patient1User, 'sanctum')->getJson("/api/patients/{$patient2->id}/consultation-history");
        $responseOther->assertStatus(403);
    }

    /**
     * Test uploading and listing medical record documents.
     */
    public function test_patient_can_upload_and_list_medical_files(): void
    {
        Storage::fake('public');

        $patient = Patient::first();
        $patientUser = $patient->user;

        $file = UploadedFile::fake()->create('blood_test_report.pdf', 300, 'application/pdf');

        $response = $this->actingAs($patientUser, 'sanctum')->postJson("/api/patients/{$patient->id}/medical-files", [
            'file' => $file,
            'file_name' => 'Routine Blood Chemistry Panel PDF',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Medical document uploaded and attached to health record successfully.',
            ])
            ->assertJsonPath('data.file_name', 'Routine Blood Chemistry Panel PDF');

        // Verify listed files
        $responseList = $this->actingAs($patientUser, 'sanctum')->getJson("/api/patients/{$patient->id}/medical-files");
        $responseList->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonFragment(['file_name' => 'Routine Blood Chemistry Panel PDF']);
    }

    /**
     * Test medical file upload rejects disallowed MIME types (e.g. executables).
     */
    public function test_medical_file_upload_rejects_disallowed_mime_types(): void
    {
        Storage::fake('public');

        $patient = Patient::first();
        $patientUser = $patient->user;

        $file = UploadedFile::fake()->create('malicious_file.exe', 100, 'application/octet-stream');

        $response = $this->actingAs($patientUser, 'sanctum')->postJson("/api/patients/{$patient->id}/medical-files", [
            'file' => $file,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }
}
