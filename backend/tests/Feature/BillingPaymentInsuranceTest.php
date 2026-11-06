<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\HospitalBranch;
use App\Models\InsuranceClaim;
use App\Models\InsuranceProvider;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\LabTest;
use App\Models\LabTestType;
use App\Models\Medicine;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class BillingPaymentInsuranceTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * Test billing officer can create manual itemized invoice with insurance co-pay calculation.
     */
    public function test_billing_officer_can_create_itemized_invoice_with_insurance_copay(): void
    {
        $billingOfficer = User::where('role', 'billing_officer')->first();
        $this->assertNotNull($billingOfficer);

        // Find patient with RSSB (85% coverage)
        $rssb = InsuranceProvider::where('provider_code', 'RSSB_RAMA')->first();
        $this->assertNotNull($rssb);
        $patient = Patient::where('insurance_provider_id', $rssb->id)->first();
        $this->assertNotNull($patient);

        $payload = [
            'patient_id' => $patient->id,
            'due_date' => now()->addDays(14)->toDateString(),
            'discount_rwf' => 0,
            'items' => [
                [
                    'item_description' => 'Clinical Specialist Consultation',
                    'item_type' => 'consultation',
                    'quantity' => 1,
                    'unit_price_rwf' => 6000.00,
                ],
                [
                    'item_description' => 'Malaria Rapid Diagnostic Test',
                    'item_type' => 'lab_test',
                    'quantity' => 1,
                    'unit_price_rwf' => 4000.00,
                ],
            ],
        ];

        // Total subtotal: 10,000 RWF.
        // RSSB coverage (85%): 8,500 RWF.
        // Patient co-pay total: 1,500 RWF.
        $response = $this->actingAs($billingOfficer, 'sanctum')->postJson('/api/invoices', $payload);

        $response->assertStatus(201);
        $this->assertEquals(10000, (float) $response->json('data.subtotal_rwf'));
        $this->assertEquals(8500, (float) $response->json('data.insurance_covered_rwf'));
        $this->assertEquals(1500, (float) $response->json('data.total_amount_rwf'));
        $this->assertEquals(1500, (float) $response->json('data.balance_rwf'));
        $this->assertEquals('unpaid', $response->json('data.status'));

        $this->assertDatabaseHas('invoices', [
            'patient_id' => $patient->id,
            'subtotal_rwf' => 10000.00,
            'insurance_covered_rwf' => 8500.00,
            'total_amount_rwf' => 1500.00,
            'status' => 'unpaid',
        ]);

        // Verify automated InsuranceClaim creation
        $this->assertDatabaseHas('insurance_claims', [
            'patient_id' => $patient->id,
            'provider_id' => $rssb->id,
            'claimed_amount_rwf' => 8500.00,
            'claim_status' => 'submitted',
        ]);
    }

    /**
     * Test auto-generating invoice from appointment bundles consultation, lab tests, and dispensed medicines.
     */
    public function test_auto_generated_invoice_from_appointment_bundles_consultation_labs_and_medicines(): void
    {
        $billingOfficer = User::where('role', 'billing_officer')->first();
        $doctorUser = User::where('role', 'doctor')->first();
        $doctor = $doctorUser->doctor;

        // Find patient with CBHI (90% coverage)
        $cbhi = InsuranceProvider::where('provider_code', 'CBHI_MUTUELLE')->first();
        $this->assertNotNull($cbhi);
        $patient = Patient::where('insurance_provider_id', $cbhi->id)->first();
        $this->assertNotNull($patient);

        $testType = LabTestType::first();
        $medicine = Medicine::first();

        // Create clinical appointment
        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'branch_id' => $doctor->branch_id,
            'booking_reference' => 'APT-INV-' . rand(1000, 9999),
            'appointment_date' => now()->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'appointment_type' => 'general',
            'status' => 'completed',
        ]);

        // 1. Add Consultation
        $consultation = Consultation::create([
            'appointment_id' => $appointment->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'symptoms' => 'Persistent fever and body chills',
            'diagnosis' => 'Acute uncomplicated malaria',
            'treatment_plan' => 'Hydration and prescribed anti-malarials',
        ]);

        // 2. Add Lab Test
        $labTest = LabTest::create([
            'appointment_id' => $appointment->id,
            'patient_id' => $patient->id,
            'test_type_id' => $testType->id,
            'requested_by' => $doctorUser->id,
            'request_date' => now(),
            'priority' => 'routine',
            'status' => 'completed',
        ]);

        // 3. Add Prescription & Item
        $prescription = Prescription::create([
            'consultation_id' => $consultation->id,
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'prescription_number' => 'RX-INV-' . rand(100, 999),
            'prescription_date' => now()->toDateString(),
            'status' => 'dispensed',
        ]);

        PrescriptionItem::create([
            'prescription_id' => $prescription->id,
            'medicine_id' => $medicine->id,
            'dosage' => '1 tab',
            'frequency' => 'Twice daily',
            'duration_days' => 5,
            'quantity_prescribed' => 2,
            'quantity_dispensed' => 2,
        ]);

        // Auto-generate invoice
        $response = $this->actingAs($billingOfficer, 'sanctum')
            ->postJson("/api/invoices/generate-from-appointment/{$appointment->id}");

        $response->assertStatus(201)
            ->assertJsonPath('data.appointment_id', $appointment->id);

        $expectedSubtotal = (float) $doctor->consultation_fee + (float) $testType->price_rwf + (2 * (float) $medicine->unit_price_rwf);
        $expectedCovered = round($expectedSubtotal * 0.90, 2);
        $expectedCoPay = max(0, $expectedSubtotal - $expectedCovered);

        $this->assertEquals($expectedSubtotal, (float) $response->json('data.subtotal_rwf'));
        $this->assertEquals($expectedCovered, (float) $response->json('data.insurance_covered_rwf'));
        $this->assertEquals($expectedCoPay, (float) $response->json('data.total_amount_rwf'));
        $this->assertEquals($expectedCoPay, (float) $response->json('data.balance_rwf'));

        // Calling it again should return the existing invoice idempotently
        $secondResponse = $this->actingAs($billingOfficer, 'sanctum')
            ->postJson("/api/invoices/generate-from-appointment/{$appointment->id}");
        $secondResponse->assertStatus(200)
            ->assertJsonPath('data.id', $response->json('data.id'));
    }

    /**
     * Test simulated MTN MoMo payment updates invoice balance and transitions status to paid.
     */
    public function test_simulated_momo_payment_updates_invoice_balance_and_status_to_paid(): void
    {
        $patient = Patient::first();
        $user = $patient->user;

        $invoice = Invoice::create([
            'patient_id' => $patient->id,
            'invoice_number' => Invoice::generateInvoiceNumber(),
            'subtotal_rwf' => 5000.00,
            'discount_rwf' => 0.00,
            'insurance_covered_rwf' => 4000.00,
            'total_amount_rwf' => 1000.00,
            'amount_paid_rwf' => 0.00,
            'balance_rwf' => 1000.00,
            'due_date' => now()->addDays(7)->toDateString(),
            'status' => 'unpaid',
        ]);

        $payload = [
            'invoice_id' => $invoice->id,
            'amount_rwf' => 1000.00,
            'payment_method' => 'momo',
            'payer_phone' => '+250 788 500 001',
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/payments', $payload);

        $response->assertStatus(201);
        $this->assertEquals(1000, (float) $response->json('data.amount_rwf'));
        $this->assertEquals('momo', $response->json('data.payment_method'));
        $this->assertEquals('successful', $response->json('data.payment_status'));

        $this->assertStringStartsWith('MOMO-', $response->json('data.transaction_reference'));

        $invoice->refresh();
        $this->assertEquals(1000.00, (float) $invoice->amount_paid_rwf);
        $this->assertEquals(0.00, (float) $invoice->balance_rwf);
        $this->assertEquals('paid', $invoice->status);
    }

    /**
     * Test partial payment via Airtel Money transitions invoice status to partially_paid.
     */
    public function test_partial_payment_updates_balance_and_status_to_partially_paid(): void
    {
        $patient = Patient::first();
        $user = $patient->user;

        $invoice = Invoice::create([
            'patient_id' => $patient->id,
            'invoice_number' => Invoice::generateInvoiceNumber(),
            'subtotal_rwf' => 6000.00,
            'discount_rwf' => 0.00,
            'insurance_covered_rwf' => 4000.00,
            'total_amount_rwf' => 2000.00,
            'amount_paid_rwf' => 0.00,
            'balance_rwf' => 2000.00,
            'due_date' => now()->addDays(7)->toDateString(),
            'status' => 'unpaid',
        ]);

        $payload = [
            'invoice_id' => $invoice->id,
            'amount_rwf' => 800.00,
            'payment_method' => 'airtel_money',
            'payer_phone' => '0728500002',
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/payments', $payload);

        $response->assertStatus(201);
        $this->assertStringStartsWith('AIRTEL-', $response->json('data.transaction_reference'));

        $invoice->refresh();
        $this->assertEquals(800.00, (float) $invoice->amount_paid_rwf);
        $this->assertEquals(1200.00, (float) $invoice->balance_rwf);
        $this->assertEquals('partially_paid', $invoice->status);
    }

    /**
     * Test payment fails when amount exceeds remaining balance.
     */
    public function test_payment_fails_when_amount_exceeds_remaining_balance(): void
    {
        $patient = Patient::first();
        $user = $patient->user;

        $invoice = Invoice::create([
            'patient_id' => $patient->id,
            'invoice_number' => Invoice::generateInvoiceNumber(),
            'subtotal_rwf' => 3000.00,
            'discount_rwf' => 0.00,
            'insurance_covered_rwf' => 2500.00,
            'total_amount_rwf' => 500.00,
            'amount_paid_rwf' => 0.00,
            'balance_rwf' => 500.00,
            'due_date' => now()->addDays(7)->toDateString(),
            'status' => 'unpaid',
        ]);

        $payload = [
            'invoice_id' => $invoice->id,
            'amount_rwf' => 1500.00, // Exceeds balance of 500
            'payment_method' => 'card',
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/payments', $payload);
        $response->assertStatus(422)
            ->assertJsonStructure(['message']);
    }

    /**
     * Test mobile money payment validates phone number format.
     */
    public function test_momo_payment_fails_with_invalid_phone_format(): void
    {
        $patient = Patient::first();
        $user = $patient->user;

        $invoice = Invoice::create([
            'patient_id' => $patient->id,
            'invoice_number' => Invoice::generateInvoiceNumber(),
            'subtotal_rwf' => 3000.00,
            'discount_rwf' => 0.00,
            'insurance_covered_rwf' => 2500.00,
            'total_amount_rwf' => 500.00,
            'amount_paid_rwf' => 0.00,
            'balance_rwf' => 500.00,
            'due_date' => now()->addDays(7)->toDateString(),
            'status' => 'unpaid',
        ]);

        $payload = [
            'invoice_id' => $invoice->id,
            'amount_rwf' => 500.00,
            'payment_method' => 'momo',
            'payer_phone' => '12345', // Invalid format
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/payments', $payload);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payer_phone']);
    }

    /**
     * Test payment receipt endpoint returns structured thermal slip representation.
     */
    public function test_payment_receipt_endpoint_returns_thermal_slip_structure(): void
    {
        $patient = Patient::first();
        $user = $patient->user;

        $invoice = Invoice::create([
            'patient_id' => $patient->id,
            'invoice_number' => Invoice::generateInvoiceNumber(),
            'subtotal_rwf' => 3000.00,
            'discount_rwf' => 0.00,
            'insurance_covered_rwf' => 2000.00,
            'total_amount_rwf' => 1000.00,
            'amount_paid_rwf' => 1000.00,
            'balance_rwf' => 0.00,
            'due_date' => now()->toDateString(),
            'status' => 'paid',
        ]);

        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            'patient_id' => $patient->id,
            'transaction_reference' => 'CARD-261106-99999',
            'amount_rwf' => 1000.00,
            'payment_method' => 'card',
            'payment_status' => 'successful',
            'paid_at' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/payments/{$payment->id}/receipt");

        $response->assertStatus(200);
        $this->assertEquals('CARD-261106-99999', $response->json('data.transaction_reference'));
        $this->assertEquals('CARD', $response->json('data.payment_method'));
        $this->assertEquals(1000, (float) $response->json('data.amount_rwf'));
        $this->assertEquals('100234891', $response->json('data.hospital.tin'));
        $this->assertEquals($patient->id, $response->json('data.patient.id'));
        $this->assertEquals($invoice->invoice_number, $response->json('data.invoice.invoice_number'));
    }

    /**
     * Test insurance claim submission and approval workflow.
     */
    public function test_insurance_claim_submission_and_approval_workflow(): void
    {
        $billingOfficer = User::where('role', 'billing_officer')->first();
        $provider = InsuranceProvider::first();
        $patient = Patient::first();

        $invoice = Invoice::create([
            'patient_id' => $patient->id,
            'invoice_number' => Invoice::generateInvoiceNumber(),
            'subtotal_rwf' => 10000.00,
            'discount_rwf' => 0.00,
            'insurance_covered_rwf' => 8500.00,
            'total_amount_rwf' => 1500.00,
            'amount_paid_rwf' => 0.00,
            'balance_rwf' => 1500.00,
            'due_date' => now()->addDays(7)->toDateString(),
            'status' => 'unpaid',
        ]);

        // Submit claim
        $submitResponse = $this->actingAs($billingOfficer, 'sanctum')->postJson('/api/insurance-claims', [
            'invoice_id' => $invoice->id,
            'provider_id' => $provider->id,
            'claimed_amount_rwf' => 8500.00,
        ]);

        $submitResponse->assertStatus(201);
        $this->assertEquals('submitted', $submitResponse->json('data.claim_status'));
        $this->assertEquals(8500, (float) $submitResponse->json('data.claimed_amount_rwf'));

        $claimId = $submitResponse->json('data.id');

        // Adjudicate: Mark under review
        $reviewResponse = $this->actingAs($billingOfficer, 'sanctum')
            ->patchJson("/api/insurance-claims/{$claimId}/status", [
                'claim_status' => 'under_review',
            ]);
        $reviewResponse->assertStatus(200);
        $this->assertEquals('under_review', $reviewResponse->json('data.claim_status'));

        // Adjudicate: Approve
        $approveResponse = $this->actingAs($billingOfficer, 'sanctum')
            ->patchJson("/api/insurance-claims/{$claimId}/status", [
                'claim_status' => 'approved',
                'approved_amount_rwf' => 8500.00,
            ]);
        $approveResponse->assertStatus(200);
        $this->assertEquals('approved', $approveResponse->json('data.claim_status'));
        $this->assertEquals(8500, (float) $approveResponse->json('data.approved_amount_rwf'));
    }

    /**
     * Test insurance claim rejection requires rejection reason.
     */
    public function test_insurance_claim_rejection_requires_reason(): void
    {
        $billingOfficer = User::where('role', 'billing_officer')->first();
        $claim = InsuranceClaim::where('claim_status', 'submitted')->first();
        if (!$claim) {
            $claim = InsuranceClaim::first();
        }

        // Attempt rejection without reason
        $response = $this->actingAs($billingOfficer, 'sanctum')
            ->patchJson("/api/insurance-claims/{$claim->id}/status", [
                'claim_status' => 'rejected',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rejection_reason']);

        // Reject with valid reason
        $validResponse = $this->actingAs($billingOfficer, 'sanctum')
            ->patchJson("/api/insurance-claims/{$claim->id}/status", [
                'claim_status' => 'rejected',
                'rejection_reason' => 'Patient policy expired prior to encounter date.',
            ]);

        $validResponse->assertStatus(200);
        $this->assertEquals('rejected', $validResponse->json('data.claim_status'));
        $this->assertEquals('Patient policy expired prior to encounter date.', $validResponse->json('data.rejection_reason'));
    }

    /**
     * Test patient can view only own invoices and payments.
     */
    public function test_patient_can_view_only_own_invoices_and_payments(): void
    {
        $patients = Patient::take(2)->get();
        $patient1 = $patients[0];
        $patient2 = $patients[1];

        $invoicePatient2 = Invoice::where('patient_id', $patient2->id)->first();
        $this->assertNotNull($invoicePatient2);

        // Patient 1 cannot access Patient 2's invoice directly
        $response = $this->actingAs($patient1->user, 'sanctum')
            ->getJson("/api/invoices/{$invoicePatient2->id}");

        $response->assertStatus(403);

        // Patient 1 listing invoices only sees their own
        $listResponse = $this->actingAs($patient1->user, 'sanctum')
            ->getJson('/api/invoices');

        $listResponse->assertStatus(200);
        foreach ($listResponse->json('data') as $inv) {
            $this->assertEquals($patient1->id, $inv['patient_id']);
        }
    }

    /**
     * Test unauthorized user cannot create invoices.
     */
    public function test_patient_cannot_create_invoices(): void
    {
        $patient = Patient::first();

        $payload = [
            'patient_id' => $patient->id,
            'due_date' => now()->toDateString(),
            'items' => [
                [
                    'item_description' => 'Unauthorized Fee',
                    'item_type' => 'other',
                    'quantity' => 1,
                    'unit_price_rwf' => 1000,
                ],
            ],
        ];

        $response = $this->actingAs($patient->user, 'sanctum')
            ->postJson('/api/invoices', $payload);

        $response->assertStatus(403);
    }
}
