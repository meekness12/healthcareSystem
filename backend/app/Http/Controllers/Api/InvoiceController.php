<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvoiceRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Appointment;
use App\Models\InsuranceClaim;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Patient;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    /**
     * List invoices with filtering by patient, status, date range, search
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Invoice::with([
            'patient.user',
            'patient.insuranceProvider',
            'items',
            'payments',
            'insuranceClaim.provider',
            'appointment.doctor.user',
            'appointment.branch',
        ]);

        // Role authorization: Patients see only their own invoices
        if ($user->role === 'patient') {
            if (!$user->patient) {
                return response()->json(['data' => []]);
            }
            $query->where('patient_id', $user->patient->id);
        } elseif ($request->filled('patient_id')) {
            $query->where('patient_id', $request->input('patient_id'));
        }

        if ($request->filled('status')) {
            $query->status($request->input('status'));
        }

        if ($request->filled('from_date') || $request->filled('to_date')) {
            $query->dateRange($request->input('from_date'), $request->input('to_date'));
        }

        if ($request->filled('search')) {
            $query->search($request->input('search'));
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $invoices = $query->latest()->paginate($perPage);

        return InvoiceResource::collection($invoices)->response();
    }

    /**
     * Show single invoice details
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $invoice = Invoice::with([
            'patient.user',
            'patient.insuranceProvider',
            'items',
            'payments',
            'insuranceClaim.provider',
            'appointment.doctor.user',
            'appointment.branch',
        ])->findOrFail($id);

        if ($user->role === 'patient' && (!$user->patient || $invoice->patient_id !== $user->patient->id)) {
            return response()->json(['message' => 'Unauthorized access to this invoice.'], 403);
        }

        return (new InvoiceResource($invoice))->response();
    }

    /**
     * Manually create an itemized invoice with insurance co-pay calculation
     */
    public function store(StoreInvoiceRequest $request): JsonResponse
    {
        $patient = Patient::with('insuranceProvider')->findOrFail($request->input('patient_id'));
        $rawItems = $request->input('items', []);

        $invoice = DB::transaction(function () use ($request, $patient, $rawItems) {
            $subtotal = 0;
            $itemsData = [];

            foreach ($rawItems as $item) {
                $qty = (int) $item['quantity'];
                $unitPrice = (float) $item['unit_price_rwf'];
                $totalPrice = round($qty * $unitPrice, 2);
                $subtotal += $totalPrice;

                $itemsData[] = [
                    'item_description' => $item['item_description'],
                    'item_type' => $item['item_type'],
                    'reference_id' => $item['reference_id'] ?? null,
                    'quantity' => $qty,
                    'unit_price_rwf' => $unitPrice,
                    'total_price_rwf' => $totalPrice,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            $discount = max(0, (float) $request->input('discount_rwf', 0));
            $netBeforeInsurance = max(0, $subtotal - $discount);

            // Compute insurance coverage
            $coveragePercent = $patient->insuranceProvider ? (float) $patient->insuranceProvider->coverage_percentage_default : 0.0;
            $insuranceCovered = round($netBeforeInsurance * ($coveragePercent / 100), 2);
            $patientCoPay = max(0, $netBeforeInsurance - $insuranceCovered);

            $invoice = Invoice::create([
                'patient_id' => $patient->id,
                'appointment_id' => $request->input('appointment_id'),
                'invoice_number' => Invoice::generateInvoiceNumber(),
                'subtotal_rwf' => $subtotal,
                'discount_rwf' => $discount,
                'insurance_covered_rwf' => $insuranceCovered,
                'total_amount_rwf' => $patientCoPay,
                'amount_paid_rwf' => 0.00,
                'balance_rwf' => $patientCoPay,
                'due_date' => $request->input('due_date'),
                'status' => 'unpaid',
            ]);

            foreach ($itemsData as &$itemData) {
                $itemData['invoice_id'] = $invoice->id;
            }
            InvoiceItem::insert($itemsData);

            // If insurance covered amount exists, create an initial claim
            if ($insuranceCovered > 0 && $patient->insurance_provider_id) {
                InsuranceClaim::create([
                    'patient_id' => $patient->id,
                    'invoice_id' => $invoice->id,
                    'provider_id' => $patient->insurance_provider_id,
                    'claim_reference' => InsuranceClaim::generateClaimReference(),
                    'claimed_amount_rwf' => $insuranceCovered,
                    'approved_amount_rwf' => 0.00,
                    'claim_status' => 'submitted',
                    'submitted_at' => now(),
                ]);
            }

            return $invoice;
        });

        $invoice->load([
            'patient.user',
            'patient.insuranceProvider',
            'items',
            'payments',
            'insuranceClaim.provider',
        ]);

        return (new InvoiceResource($invoice))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Auto-bundle an appointment's consultation, lab tests, and medications into an invoice
     */
    public function generateFromAppointment(Request $request, int $appointmentId): JsonResponse
    {
        $user = $request->user();
        if (!in_array($user->role, ['admin', 'billing_officer', 'doctor'])) {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        $appointment = Appointment::with([
            'patient.user',
            'patient.insuranceProvider',
            'doctor.user',
            'doctor.specialty',
            'consultation.prescriptions.items.medicine',
            'labTests.testType',
            'invoice',
        ])->findOrFail($appointmentId);

        // If an invoice already exists for this appointment, return it
        if ($appointment->invoice) {
            $appointment->invoice->load([
                'patient.user',
                'patient.insuranceProvider',
                'items',
                'payments',
                'insuranceClaim.provider',
            ]);
            return (new InvoiceResource($appointment->invoice))->response();
        }

        $patient = $appointment->patient;
        $itemsToCreate = [];

        // 1. Doctor Consultation Fee
        $consultationFee = (float) ($appointment->doctor->consultation_fee ?? 5000.00);
        $doctorName = $appointment->doctor->user->name ?? 'Doctor';
        $specialty = $appointment->doctor->specialty->specialty_name ?? 'Clinical Consultation';

        $itemsToCreate[] = [
            'item_description' => "Clinical Consultation: Dr. {$doctorName} ({$specialty})",
            'item_type' => 'consultation',
            'reference_id' => $appointment->consultation?->id ?? $appointment->id,
            'quantity' => 1,
            'unit_price_rwf' => $consultationFee,
            'total_price_rwf' => $consultationFee,
        ];

        // 2. Ordered Lab Tests
        if ($appointment->labTests->isNotEmpty()) {
            foreach ($appointment->labTests as $labTest) {
                if ($labTest->testType) {
                    $testPrice = (float) $labTest->testType->price_rwf;
                    $itemsToCreate[] = [
                        'item_description' => "Laboratory Diagnostics: {$labTest->testType->test_name}",
                        'item_type' => 'lab_test',
                        'reference_id' => $labTest->id,
                        'quantity' => 1,
                        'unit_price_rwf' => $testPrice,
                        'total_price_rwf' => $testPrice,
                    ];
                }
            }
        }

        // 3. Prescribed / Dispensed Medicines
        if ($appointment->consultation && $appointment->consultation->prescriptions->isNotEmpty()) {
            foreach ($appointment->consultation->prescriptions as $prescription) {
                foreach ($prescription->items as $pItem) {
                    if ($pItem->medicine) {
                        $qty = (int) ($pItem->quantity_dispensed > 0 ? $pItem->quantity_dispensed : $pItem->quantity_prescribed);
                        $unitPrice = (float) $pItem->medicine->unit_price_rwf;
                        $lineTotal = round($qty * $unitPrice, 2);

                        $itemsToCreate[] = [
                            'item_description' => "Pharmacy: {$pItem->medicine->medicine_name} ({$pItem->medicine->strength})",
                            'item_type' => 'medicine',
                            'reference_id' => $pItem->id,
                            'quantity' => $qty,
                            'unit_price_rwf' => $unitPrice,
                            'total_price_rwf' => $lineTotal,
                        ];
                    }
                }
            }
        }

        $invoice = DB::transaction(function () use ($appointment, $patient, $itemsToCreate) {
            $subtotal = 0;
            foreach ($itemsToCreate as $item) {
                $subtotal += $item['total_price_rwf'];
            }

            $coveragePercent = $patient->insuranceProvider ? (float) $patient->insuranceProvider->coverage_percentage_default : 0.0;
            $insuranceCovered = round($subtotal * ($coveragePercent / 100), 2);
            $patientCoPay = max(0, $subtotal - $insuranceCovered);

            $invoice = Invoice::create([
                'patient_id' => $patient->id,
                'appointment_id' => $appointment->id,
                'invoice_number' => Invoice::generateInvoiceNumber(),
                'subtotal_rwf' => $subtotal,
                'discount_rwf' => 0.00,
                'insurance_covered_rwf' => $insuranceCovered,
                'total_amount_rwf' => $patientCoPay,
                'amount_paid_rwf' => 0.00,
                'balance_rwf' => $patientCoPay,
                'due_date' => now()->addDays(7)->toDateString(),
                'status' => 'unpaid',
            ]);

            foreach ($itemsToCreate as &$item) {
                $item['invoice_id'] = $invoice->id;
                $item['created_at'] = now();
                $item['updated_at'] = now();
            }
            InvoiceItem::insert($itemsToCreate);

            if ($insuranceCovered > 0 && $patient->insurance_provider_id) {
                InsuranceClaim::create([
                    'patient_id' => $patient->id,
                    'invoice_id' => $invoice->id,
                    'provider_id' => $patient->insurance_provider_id,
                    'claim_reference' => InsuranceClaim::generateClaimReference(),
                    'claimed_amount_rwf' => $insuranceCovered,
                    'approved_amount_rwf' => 0.00,
                    'claim_status' => 'submitted',
                    'submitted_at' => now(),
                ]);
            }

            return $invoice;
        });

        $invoice->load([
            'patient.user',
            'patient.insuranceProvider',
            'items',
            'payments',
            'insuranceClaim.provider',
            'appointment.doctor.user',
            'appointment.branch',
        ]);

        return (new InvoiceResource($invoice))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Download or stream PDF invoice using DomPDF
     */
    public function downloadPdf(Request $request, int $id): Response|JsonResponse
    {
        $user = $request->user();
        $invoice = Invoice::with([
            'patient.user',
            'patient.insuranceProvider',
            'items',
            'payments',
            'insuranceClaim.provider',
            'appointment.branch',
            'appointment.doctor.user',
        ])->findOrFail($id);

        if ($user->role === 'patient' && (!$user->patient || $invoice->patient_id !== $user->patient->id)) {
            return response()->json(['message' => 'Unauthorized access.'], 403);
        }

        $pdf = Pdf::loadView('pdf.invoice', compact('invoice'));
        return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
    }
}
