<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProcessPaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Invoice;
use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * List payment transactions with filtering
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Payment::with(['invoice', 'patient.user']);

        if ($user->role === 'patient') {
            if (!$user->patient) {
                return response()->json(['data' => []]);
            }
            $query->where('patient_id', $user->patient->id);
        } elseif ($request->filled('patient_id')) {
            $query->where('patient_id', $request->input('patient_id'));
        }

        if ($request->filled('payment_method')) {
            $query->method($request->input('payment_method'));
        }

        if ($request->filled('status')) {
            $query->where('payment_status', $request->input('status'));
        }

        if ($request->filled('from_date') || $request->filled('to_date')) {
            $query->dateRange($request->input('from_date'), $request->input('to_date'));
        }

        if ($request->filled('search')) {
            $query->search($request->input('search'));
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $payments = $query->latest('paid_at')->paginate($perPage);

        return PaymentResource::collection($payments)->response();
    }

    /**
     * Process a payment (MTN MoMo, Airtel Money, Card, or Cash)
     */
    public function store(ProcessPaymentRequest $request): JsonResponse
    {
        $user = $request->user();
        $invoice = Invoice::with(['patient.user'])->findOrFail($request->input('invoice_id'));

        // Authorization check: Patients can only pay their own invoices
        if ($user->role === 'patient' && (!$user->patient || $invoice->patient_id !== $user->patient->id)) {
            return response()->json(['message' => 'Unauthorized payment attempt.'], 403);
        }

        // Validate that invoice is not already paid
        if ($invoice->balance_rwf <= 0 || $invoice->status === 'paid') {
            return response()->json([
                'message' => 'This invoice has already been fully paid and has a zero balance.',
            ], 422);
        }

        $amount = (float) $request->input('amount_rwf');

        // Validate amount does not exceed remaining balance
        if ($amount > (float) $invoice->balance_rwf) {
            return response()->json([
                'message' => "Payment amount (" . number_format($amount) . " RWF) cannot exceed remaining balance (" . number_format($invoice->balance_rwf) . " RWF).",
            ], 422);
        }

        $payment = DB::transaction(function () use ($request, $invoice, $amount) {
            $method = $request->input('payment_method');
            $ref = Payment::generateTransactionReference($method);

            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'patient_id' => $invoice->patient_id,
                'transaction_reference' => $ref,
                'amount_rwf' => $amount,
                'payment_method' => $method,
                'payer_phone' => $request->input('payer_phone'),
                'payment_status' => 'successful',
                'paid_at' => now(),
            ]);

            // Update Invoice amount paid and balance
            $invoice->amount_paid_rwf = (float) $invoice->amount_paid_rwf + $amount;
            $invoice->balance_rwf = max(0, (float) $invoice->total_amount_rwf - (float) $invoice->amount_paid_rwf);

            if ($invoice->balance_rwf <= 0) {
                $invoice->status = 'paid';
            } else {
                $invoice->status = 'partially_paid';
            }

            $invoice->save();

            return $payment;
        });

        $payment->load(['invoice', 'patient.user']);

        return (new PaymentResource($payment))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Show single payment
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $payment = Payment::with(['invoice', 'patient.user'])->findOrFail($id);

        if ($user->role === 'patient' && (!$user->patient || $payment->patient_id !== $user->patient->id)) {
            return response()->json(['message' => 'Unauthorized access.'], 403);
        }

        return (new PaymentResource($payment))->response();
    }

    /**
     * Structured JSON receipt representation for printable UI
     */
    public function receipt(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $payment = Payment::with([
            'invoice.items',
            'patient.user',
            'patient.insuranceProvider',
        ])->findOrFail($id);

        if ($user->role === 'patient' && (!$user->patient || $payment->patient_id !== $user->patient->id)) {
            return response()->json(['message' => 'Unauthorized access.'], 403);
        }

        return response()->json([
            'data' => [
                'receipt_number' => 'REC-' . str_replace(['MOMO-', 'AIRTEL-', 'CARD-', 'CASH-'], '', $payment->transaction_reference),
                'transaction_reference' => $payment->transaction_reference,
                'paid_at' => $payment->paid_at->toIso8601String(),
                'formatted_paid_at' => $payment->paid_at->format('d M Y, H:i'),
                'payment_method' => strtoupper(str_replace('_', ' ', $payment->payment_method)),
                'payer_phone' => $payment->payer_phone,
                'amount_rwf' => (float) $payment->amount_rwf,
                'formatted_amount' => number_format($payment->amount_rwf) . ' RWF',
                'hospital' => [
                    'name' => 'Healthcare System Rwanda',
                    'branch' => 'Karongi Provincial Hospital',
                    'address' => 'B.P. 45 Kibuye, Western Province',
                    'tin' => '100234891',
                    'phone' => '+250 788 200 001',
                    'email' => 'billing@hospital.rw',
                ],
                'patient' => [
                    'id' => $payment->patient->id,
                    'patient_number' => $payment->patient->patient_number,
                    'name' => $payment->patient->user->name ?? 'Patient',
                    'national_id' => $payment->patient->national_id,
                    'insurance_provider' => $payment->patient->insuranceProvider->provider_name ?? 'Self-Pay',
                    'insurance_number' => $payment->patient->insurance_number,
                ],
                'invoice' => [
                    'id' => $payment->invoice->id,
                    'invoice_number' => $payment->invoice->invoice_number,
                    'subtotal_rwf' => (float) $payment->invoice->subtotal_rwf,
                    'insurance_covered_rwf' => (float) $payment->invoice->insurance_covered_rwf,
                    'patient_co_pay_rwf' => (float) $payment->invoice->total_amount_rwf,
                    'total_paid_rwf' => (float) $payment->invoice->amount_paid_rwf,
                    'balance_remaining_rwf' => (float) $payment->invoice->balance_rwf,
                    'status' => $payment->invoice->status,
                ],
                'status' => 'verified_successful',
                'pdf_url' => url("/api/payments/{$payment->id}/receipt/pdf"),
            ],
        ]);
    }

    /**
     * Download or stream PDF receipt
     */
    public function downloadReceiptPdf(Request $request, int $id): Response|JsonResponse
    {
        $user = $request->user();
        $payment = Payment::with([
            'invoice.items',
            'patient.user',
            'patient.insuranceProvider',
        ])->findOrFail($id);

        if ($user->role === 'patient' && (!$user->patient || $payment->patient_id !== $user->patient->id)) {
            return response()->json(['message' => 'Unauthorized access.'], 403);
        }

        $pdf = Pdf::loadView('pdf.receipt', compact('payment'));
        return $pdf->download("receipt-{$payment->transaction_reference}.pdf");
    }
}
