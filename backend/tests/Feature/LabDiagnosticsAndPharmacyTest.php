<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\LabResult;
use App\Models\LabTest;
use App\Models\LabTestType;
use App\Models\Medicine;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LabDiagnosticsAndPharmacyTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * Test doctor can list catalogue and order laboratory test.
     */
    public function test_doctor_can_list_test_types_and_order_lab_test(): void
    {
        $doctorUser = User::where('role', 'doctor')->first();
        $this->assertNotNull($doctorUser);
        $doctor = $doctorUser->doctor;
        $patient = Patient::first();
        $testType = LabTestType::where('status', 'active')->first();

        // 1. List test types
        $responseTypes = $this->actingAs($doctorUser, 'sanctum')->getJson('/api/lab/test-types');
        $responseTypes->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonFragment(['test_name' => $testType->test_name]);

        // Create appointment
        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'branch_id' => $doctor->branch_id,
            'booking_reference' => 'APT-LAB-' . rand(1000, 9999),
            'appointment_date' => Carbon::now('Africa/Kigali')->format('Y-m-d'),
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'appointment_type' => 'general',
            'status' => 'confirmed',
            'reason' => 'Suspected malaria with high grade fever',
        ]);

        // 2. Doctor orders test
        $responseOrder = $this->actingAs($doctorUser, 'sanctum')->postJson('/api/lab/tests', [
            'appointment_id' => $appointment->id,
            'patient_id' => $patient->id,
            'test_type_id' => $testType->id,
            'priority' => 'urgent',
        ]);

        $responseOrder->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Laboratory diagnostic test ordered successfully.',
            ])
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.priority', 'urgent');

        $this->assertDatabaseHas('lab_tests', [
            'appointment_id' => $appointment->id,
            'patient_id' => $patient->id,
            'test_type_id' => $testType->id,
            'status' => 'pending',
        ]);
    }

    /**
     * Test lab technician can claim test order.
     */
    public function test_lab_technician_can_claim_test_order(): void
    {
        $labTech = User::where('role', 'lab_technician')->first();
        $this->assertNotNull($labTech);

        $patient = Patient::first();
        $doctor = Doctor::first();
        $testType = LabTestType::first();

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'branch_id' => $doctor->branch_id,
            'booking_reference' => 'APT-LAB-' . rand(1000, 9999),
            'appointment_date' => Carbon::now('Africa/Kigali')->format('Y-m-d'),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'appointment_type' => 'general',
            'status' => 'confirmed',
        ]);

        $labTest = LabTest::create([
            'appointment_id' => $appointment->id,
            'patient_id' => $patient->id,
            'test_type_id' => $testType->id,
            'requested_by' => $doctor->user_id,
            'priority' => 'routine',
            'request_date' => now(),
            'status' => 'pending',
        ]);

        $response = $this->actingAs($labTech, 'sanctum')->postJson("/api/lab/tests/{$labTest->id}/assign");
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Lab test claimed. Status transitioned to In Progress.',
            ])
            ->assertJsonPath('data.status', 'in_progress')
            ->assertJsonPath('data.assigned_to.id', $labTech->id);

        $labTest->refresh();
        $this->assertEquals('in_progress', $labTest->status);
        $this->assertEquals($labTech->id, $labTest->assigned_to);
    }

    /**
     * Test lab technician can record diagnostic results with PDF report upload.
     */
    public function test_lab_technician_can_record_results_and_upload_pdf(): void
    {
        Storage::fake('public');

        $labTech = User::where('role', 'lab_technician')->first();
        $patient = Patient::first();
        $doctor = Doctor::first();
        $testType = LabTestType::where('test_name', 'like', '%Malaria%')->first() ?? LabTestType::first();

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'branch_id' => $doctor->branch_id,
            'booking_reference' => 'APT-LAB-' . rand(1000, 9999),
            'appointment_date' => Carbon::now('Africa/Kigali')->format('Y-m-d'),
            'start_time' => '11:00:00',
            'end_time' => '11:30:00',
            'appointment_type' => 'general',
            'status' => 'confirmed',
        ]);

        $labTest = LabTest::create([
            'appointment_id' => $appointment->id,
            'patient_id' => $patient->id,
            'test_type_id' => $testType->id,
            'requested_by' => $doctor->user_id,
            'assigned_to' => $labTech->id,
            'priority' => 'emergency',
            'request_date' => now(),
            'status' => 'in_progress',
        ]);

        $pdfFile = UploadedFile::fake()->create('signed_malaria_report.pdf', 300, 'application/pdf');

        $response = $this->actingAs($labTech, 'sanctum')->postJson("/api/lab/tests/{$labTest->id}/result", [
            'result_summary' => 'Positive for Plasmodium falciparum. Ring form trophozoites observed; estimated density 14,200 parasites/uL.',
            'reference_ranges' => 'Normal: Negative / No parasites detected',
            'result_details' => [
                'species' => 'P. falciparum',
                'density_ul' => 14200,
                'gametocytes' => 'None',
            ],
            'report_pdf' => $pdfFile,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Diagnostic results recorded and test completed successfully.',
            ])
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.result.result_summary', 'Positive for Plasmodium falciparum. Ring form trophozoites observed; estimated density 14,200 parasites/uL.');

        $labTest->refresh();
        $this->assertEquals('completed', $labTest->status);
        $this->assertNotNull($labTest->result);
        $this->assertNotNull($labTest->result->report_pdf_path);
        Storage::disk('public')->assertExists($labTest->result->report_pdf_path);
    }

    /**
     * Test lab result upload rejects non-PDF files.
     */
    public function test_lab_result_upload_rejects_non_pdf_files(): void
    {
        Storage::fake('public');

        $labTech = User::where('role', 'lab_technician')->first();
        $patient = Patient::first();
        $doctor = Doctor::first();
        $testType = LabTestType::first();

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'branch_id' => $doctor->branch_id,
            'booking_reference' => 'APT-LAB-' . rand(1000, 9999),
            'appointment_date' => Carbon::now('Africa/Kigali')->format('Y-m-d'),
            'start_time' => '12:00:00',
            'end_time' => '12:30:00',
            'appointment_type' => 'general',
            'status' => 'confirmed',
        ]);

        $labTest = LabTest::create([
            'appointment_id' => $appointment->id,
            'patient_id' => $patient->id,
            'test_type_id' => $testType->id,
            'requested_by' => $doctor->user_id,
            'priority' => 'routine',
            'request_date' => now(),
            'status' => 'in_progress',
        ]);

        $txtFile = UploadedFile::fake()->create('report.txt', 100, 'text/plain');

        $response = $this->actingAs($labTech, 'sanctum')->postJson("/api/lab/tests/{$labTest->id}/result", [
            'result_summary' => 'Test observation',
            'report_pdf' => $txtFile,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['report_pdf']);
    }

    /**
     * Test patient can view own lab tests and cannot view other patients.
     */
    public function test_patient_can_view_own_lab_tests_and_not_others(): void
    {
        $patient1 = Patient::first();
        $patient2 = Patient::where('id', '!=', $patient1->id)->first();
        $this->assertNotNull($patient2);

        $patient1User = $patient1->user;

        // Query lab tests as patient 1
        $response = $this->actingAs($patient1User, 'sanctum')->getJson('/api/lab/tests');
        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        // Patient 1 tries to query patient 2 explicitly
        $responseFilter = $this->actingAs($patient1User, 'sanctum')->getJson("/api/lab/tests?patient_id={$patient2->id}");
        $responseFilter->assertStatus(200);

        // All returned tests must strictly belong to patient 1
        $data = $responseFilter->json('data');
        foreach ($data as $t) {
            $this->assertEquals($patient1->id, $t['patient']['id']);
        }
    }

    /**
     * Test pharmacist can dispense medications and decrement pharmacy stock atomically.
     */
    public function test_pharmacist_can_dispense_medications_and_decrement_stock(): void
    {
        $pharmacist = User::where('role', 'pharmacist')->first();
        $this->assertNotNull($pharmacist);

        $patient = Patient::first();
        $doctor = Doctor::first();
        $medicine = Medicine::where('stock_quantity', '>', 50)->first();
        $initialStock = $medicine->stock_quantity;

        $consultation = Consultation::create([
            'appointment_id' => Appointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'branch_id' => $doctor->branch_id,
                'booking_reference' => 'APT-DISP-' . rand(1000, 9999),
                'appointment_date' => Carbon::now('Africa/Kigali')->format('Y-m-d'),
                'start_time' => '14:00:00',
                'end_time' => '14:30:00',
                'appointment_type' => 'general',
                'status' => 'completed',
                'reason' => 'Pharyngitis',
            ])->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'symptoms' => 'Sore throat',
            'diagnosis' => 'Acute Pharyngitis',
        ]);

        $prescription = Prescription::create([
            'consultation_id' => $consultation->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'prescription_number' => Prescription::generatePrescriptionNumber(),
            'prescription_date' => now()->format('Y-m-d'),
            'instructions' => 'Take 1 tablet TID',
            'status' => 'issued',
        ]);

        $item = PrescriptionItem::create([
            'prescription_id' => $prescription->id,
            'medicine_id' => $medicine->id,
            'dosage' => '500mg',
            'frequency' => 'Three times daily (TID)',
            'duration_days' => 5,
            'quantity_prescribed' => 15,
            'quantity_dispensed' => 0,
        ]);

        // Pharmacist dispenses all 15 tablets
        $response = $this->actingAs($pharmacist, 'sanctum')->postJson('/api/pharmacy/dispense', [
            'prescription_id' => $prescription->id,
            'notes' => 'Full regimen dispensed with complete counseling.',
            'items' => [
                [
                    'prescription_item_id' => $item->id,
                    'quantity_dispensed' => 15,
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Medications dispensed and warehouse stock decremented successfully.',
            ])
            ->assertJsonPath('data.prescription_status', 'dispensed');

        // Check stock decremented
        $medicine->refresh();
        $this->assertEquals($initialStock - 15, $medicine->stock_quantity);

        // Check prescription item quantity updated
        $item->refresh();
        $this->assertEquals(15, $item->quantity_dispensed);

        // Check prescription status is dispensed
        $prescription->refresh();
        $this->assertEquals('dispensed', $prescription->status);
    }

    /**
     * Test dispensation fails when pharmacy stock is insufficient.
     */
    public function test_dispensation_fails_when_stock_is_insufficient(): void
    {
        $pharmacist = User::where('role', 'pharmacist')->first();
        $patient = Patient::first();
        $doctor = Doctor::first();

        // Create a medicine with low stock (2 units)
        $lowStockMed = Medicine::create([
            'medicine_name' => 'Rare Specialty Inhaler',
            'category' => 'Respiratory',
            'unit_price_rwf' => 15000,
            'stock_quantity' => 2,
            'reorder_level' => 5,
            'status' => 'active',
        ]);

        $consultation = Consultation::create([
            'appointment_id' => Appointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'branch_id' => $doctor->branch_id,
                'booking_reference' => 'APT-LOW-' . rand(1000, 9999),
                'appointment_date' => Carbon::now('Africa/Kigali')->format('Y-m-d'),
                'start_time' => '15:00:00',
                'end_time' => '15:30:00',
                'appointment_type' => 'general',
                'status' => 'completed',
                'reason' => 'Asthma',
            ])->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'symptoms' => 'Wheezing',
            'diagnosis' => 'Bronchial Asthma',
        ]);

        $prescription = Prescription::create([
            'consultation_id' => $consultation->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'prescription_number' => Prescription::generatePrescriptionNumber(),
            'prescription_date' => now()->format('Y-m-d'),
            'status' => 'issued',
        ]);

        $item = PrescriptionItem::create([
            'prescription_id' => $prescription->id,
            'medicine_id' => $lowStockMed->id,
            'dosage' => '1 puff',
            'frequency' => 'PRN',
            'duration_days' => 30,
            'quantity_prescribed' => 5,
            'quantity_dispensed' => 0,
        ]);

        // Pharmacist attempts to dispense 5 units when only 2 are available
        $response = $this->actingAs($pharmacist, 'sanctum')->postJson('/api/pharmacy/dispense', [
            'prescription_id' => $prescription->id,
            'items' => [
                [
                    'prescription_item_id' => $item->id,
                    'quantity_dispensed' => 5,
                ],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJson(['success' => false])
            ->assertJsonFragment(['message' => 'Insufficient pharmacy stock for Rare Specialty Inhaler. Available: 2, Requested: 5.']);

        // Verify stock was not changed
        $lowStockMed->refresh();
        $this->assertEquals(2, $lowStockMed->stock_quantity);
    }

    /**
     * Test partial dispensation sets prescription status to partially_dispensed.
     */
    public function test_partial_dispensation_sets_prescription_status_to_partially_dispensed(): void
    {
        $pharmacist = User::where('role', 'pharmacist')->first();
        $patient = Patient::first();
        $doctor = Doctor::first();
        $medicine = Medicine::where('stock_quantity', '>', 50)->first();

        $consultation = Consultation::create([
            'appointment_id' => Appointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'branch_id' => $doctor->branch_id,
                'booking_reference' => 'APT-PART-' . rand(1000, 9999),
                'appointment_date' => Carbon::now('Africa/Kigali')->format('Y-m-d'),
                'start_time' => '16:00:00',
                'end_time' => '16:30:00',
                'appointment_type' => 'general',
                'status' => 'completed',
                'reason' => 'Pain',
            ])->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'symptoms' => 'Backache',
            'diagnosis' => 'Lumbar strain',
        ]);

        $prescription = Prescription::create([
            'consultation_id' => $consultation->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'prescription_number' => Prescription::generatePrescriptionNumber(),
            'prescription_date' => now()->format('Y-m-d'),
            'status' => 'issued',
        ]);

        $item = PrescriptionItem::create([
            'prescription_id' => $prescription->id,
            'medicine_id' => $medicine->id,
            'dosage' => '400mg',
            'frequency' => 'BID',
            'duration_days' => 10,
            'quantity_prescribed' => 20,
            'quantity_dispensed' => 0,
        ]);

        // Pharmacist dispenses only 10 out of 20
        $response = $this->actingAs($pharmacist, 'sanctum')->postJson('/api/pharmacy/dispense', [
            'prescription_id' => $prescription->id,
            'items' => [
                [
                    'prescription_item_id' => $item->id,
                    'quantity_dispensed' => 10,
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.prescription_status', 'partially_dispensed');

        $prescription->refresh();
        $this->assertEquals('partially_dispensed', $prescription->status);

        $item->refresh();
        $this->assertEquals(10, $item->quantity_dispensed);
    }

    /**
     * Test non-pharmacist cannot dispense medications.
     */
    public function test_non_pharmacist_cannot_dispense_medications(): void
    {
        $patientUser = User::where('role', 'patient')->first();
        $prescription = Prescription::first();

        $response = $this->actingAs($patientUser, 'sanctum')->postJson('/api/pharmacy/dispense', [
            'prescription_id' => $prescription ? $prescription->id : 1,
            'items' => [],
        ]);

        $response->assertStatus(403);
    }
}
