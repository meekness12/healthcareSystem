<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\Consultation;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\HospitalBranch;
use App\Models\InsuranceClaim;
use App\Models\InsuranceProvider;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    /**
     * Stream appointments CSV dataset
     */
    public function appointmentsCsv(Request $request): StreamedResponse
    {
        $filename = 'appointments_export_' . date('Y-m-d_His') . '.csv';

        // Record audit trail
        AuditLog::record(
            'export_appointments_csv',
            'appointments',
            null,
            ['filters' => $request->only(['branch_id', 'status', 'date_from', 'date_to'])],
            $request->user()?->id,
            $request->ip()
        );

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return new StreamedResponse(function () use ($request) {
            $handle = fopen('php://output', 'w');
            // Write BOM for UTF-8 Excel support
            fputs($handle, "\xEF\xBB\xBF");

            // CSV Header Row
            fputcsv($handle, [
                'Booking Reference',
                'Patient Name',
                'National ID (NIN)',
                'Doctor Name',
                'Hospital Branch',
                'Department',
                'Appointment Date',
                'Start Time',
                'End Time',
                'Type',
                'Emergency',
                'Status',
                'Consultation Fee (RWF)',
                'Invoice Number',
                'Payment Status',
                'Booked At',
            ]);

            $query = Appointment::with([
                'patient.user',
                'doctor.user',
                'doctor.department',
                'branch',
                'invoice',
            ])->latest('appointment_date');

            if ($request->filled('branch_id')) {
                $query->where('branch_id', $request->input('branch_id'));
            }
            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }
            if ($request->filled('date_from')) {
                $query->whereDate('appointment_date', '>=', $request->input('date_from'));
            }
            if ($request->filled('date_to')) {
                $query->whereDate('appointment_date', '<=', $request->input('date_to'));
            }

            $query->chunk(150, function ($appointments) use ($handle) {
                foreach ($appointments as $apt) {
                    fputcsv($handle, [
                        $apt->booking_reference ?? ('APT-' . str_pad($apt->id, 5, '0', STR_PAD_LEFT)),
                        $apt->patient?->user?->name ?? 'Unknown Patient',
                        $apt->patient?->national_id ?? 'N/A',
                        $apt->doctor?->user?->name ? ('Dr. ' . $apt->doctor->user->name) : 'N/A',
                        $apt->branch?->branch_name ?? 'N/A',
                        $apt->doctor?->department?->department_name ?? 'N/A',
                        $apt->appointment_date ? Carbon::parse($apt->appointment_date)->format('Y-m-d') : 'N/A',
                        $apt->start_time ?? 'N/A',
                        $apt->end_time ?? 'N/A',
                        ucfirst($apt->appointment_type ?? 'standard'),
                        $apt->is_emergency ? 'YES' : 'NO',
                        ucfirst($apt->status ?? 'pending'),
                        $apt->doctor?->consultation_fee ?? 0,
                        $apt->invoice?->invoice_number ?? 'None',
                        ucfirst($apt->invoice?->status ?? 'unbilled'),
                        $apt->created_at ? $apt->created_at->format('Y-m-d H:i:s') : 'N/A',
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Stream revenue and payment transactions CSV dataset
     */
    public function revenueCsv(Request $request): StreamedResponse
    {
        $filename = 'revenue_transactions_export_' . date('Y-m-d_His') . '.csv';

        // Record audit trail
        AuditLog::record(
            'export_revenue_csv',
            'payments',
            null,
            ['filters' => $request->only(['payment_method', 'payment_status', 'date_from', 'date_to'])],
            $request->user()?->id,
            $request->ip()
        );

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return new StreamedResponse(function () use ($request) {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Transaction Reference',
                'Paid Date & Time',
                'Patient Name',
                'National ID (NIN)',
                'Invoice Number',
                'Payment Method',
                'Payer Phone',
                'Amount (RWF)',
                'Payment Status',
                'Recorded At',
            ]);

            $query = Payment::with([
                'invoice',
                'patient.user',
            ])->latest('paid_at');

            if ($request->filled('payment_method')) {
                $query->where('payment_method', $request->input('payment_method'));
            }
            if ($request->filled('payment_status')) {
                $query->where('payment_status', $request->input('payment_status'));
            }
            if ($request->filled('date_from')) {
                $query->whereDate('paid_at', '>=', $request->input('date_from'));
            }
            if ($request->filled('date_to')) {
                $query->whereDate('paid_at', '<=', $request->input('date_to'));
            }

            $query->chunk(150, function ($payments) use ($handle) {
                foreach ($payments as $pay) {
                    fputcsv($handle, [
                        $pay->transaction_reference,
                        $pay->paid_at ? $pay->paid_at->format('Y-m-d H:i:s') : 'Pending',
                        $pay->patient?->user?->name ?? 'Walk-in Patient',
                        $pay->patient?->national_id ?? 'N/A',
                        $pay->invoice?->invoice_number ?? 'N/A',
                        strtoupper($pay->payment_method),
                        $pay->payer_phone ?? 'N/A',
                        $pay->amount_rwf,
                        ucfirst($pay->payment_status),
                        $pay->created_at ? $pay->created_at->format('Y-m-d H:i:s') : 'N/A',
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Stream security audit logs CSV dataset
     */
    public function auditLogsCsv(Request $request): StreamedResponse
    {
        $filename = 'audit_logs_export_' . date('Y-m-d_His') . '.csv';

        // Record audit trail
        AuditLog::record(
            'export_audit_logs_csv',
            'audit_logs',
            null,
            ['filters' => $request->only(['action', 'target_table', 'date_from', 'date_to'])],
            $request->user()?->id,
            $request->ip()
        );

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return new StreamedResponse(function () use ($request) {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Log ID',
                'Timestamp',
                'User Name',
                'User Email',
                'User Role',
                'Action',
                'Target Table',
                'Target ID',
                'IP Address',
                'Details',
            ]);

            $query = AuditLog::with('user')->latest();

            if ($request->filled('action')) {
                $query->where('action', $request->input('action'));
            }
            if ($request->filled('target_table')) {
                $query->where('target_table', $request->input('target_table'));
            }
            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->input('date_from'));
            }
            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->input('date_to'));
            }

            $query->chunk(200, function ($logs) use ($handle) {
                foreach ($logs as $log) {
                    $detailsStr = is_array($log->details) ? json_encode($log->details) : ($log->details ?? '');
                    fputcsv($handle, [
                        $log->id,
                        $log->created_at ? $log->created_at->format('Y-m-d H:i:s') : '',
                        $log->user?->name ?? 'System',
                        $log->user?->email ?? 'system@healthcare.gov.rw',
                        $log->user?->role ?? 'system',
                        $log->action,
                        $log->target_table ?? 'N/A',
                        $log->target_id ?? 'N/A',
                        $log->ip_address ?? '127.0.0.1',
                        $detailsStr,
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Generate and download Executive Analytics Report PDF via DomPDF
     */
    public function executiveReportPdf(Request $request): Response
    {
        $user = $request->user();

        // 1. Executive KPIs
        $overview = [
            'total_patients' => Patient::count(),
            'total_doctors' => Doctor::where('status', 'active')->count(),
            'total_appointments' => Appointment::count(),
            'completed_appointments' => Appointment::where('status', 'completed')->count(),
            'total_consultations' => Consultation::count(),
            'total_invoices' => Invoice::count(),
            'total_revenue_rwf' => (float) Payment::where('payment_status', 'successful')->sum('amount_rwf'),
            'outstanding_balances_rwf' => (float) Invoice::sum('balance_rwf'),
            'total_approved_claims_rwf' => (float) InsuranceClaim::whereIn('claim_status', ['approved', 'paid'])->sum('approved_amount_rwf'),
            'active_branches' => HospitalBranch::where('status', 'active')->count(),
        ];

        // 2. Branch Performance
        $branches = HospitalBranch::where('status', 'active')->get()->map(function ($branch) {
            $appointmentsCount = Appointment::where('branch_id', $branch->id)->count();
            $doctorsCount = Doctor::where('branch_id', $branch->id)->where('status', 'active')->count();

            $revenueRwf = (float) Payment::where('payment_status', 'successful')
                ->whereHas('invoice.appointment', function ($q) use ($branch) {
                    $q->where('branch_id', $branch->id);
                })
                ->sum('amount_rwf');

            return [
                'id' => $branch->id,
                'branch_name' => $branch->branch_name,
                'province' => $branch->province,
                'district' => $branch->district,
                'doctors_count' => $doctorsCount,
                'appointments_count' => $appointmentsCount,
                'revenue_rwf' => $revenueRwf,
            ];
        });

        // 3. Department Clinical Workloads
        $totalConsultations = Consultation::count();
        $departments = Department::where('status', 'active')->get()->map(function ($dept) use ($totalConsultations) {
            $doctorCount = Doctor::where('department_id', $dept->id)->where('status', 'active')->count();
            $consultationCount = Consultation::whereHas('doctor', function ($q) use ($dept) {
                $q->where('department_id', $dept->id);
            })->count();

            $percentage = $totalConsultations > 0
                ? round(($consultationCount / $totalConsultations) * 100, 1)
                : 0;

            return [
                'id' => $dept->id,
                'department_name' => $dept->department_name,
                'doctor_count' => $doctorCount,
                'consultation_count' => $consultationCount,
                'percentage' => $percentage,
            ];
        });

        // 4. Insurance Claims Distribution
        $insuranceSummary = InsuranceProvider::all()->map(function ($provider) {
            $claimsCount = InsuranceClaim::where('provider_id', $provider->id)->count();
            $approvedAmountRwf = (float) InsuranceClaim::where('provider_id', $provider->id)
                ->whereIn('claim_status', ['approved', 'paid'])
                ->sum('approved_amount_rwf');

            return [
                'provider_name' => $provider->provider_name,
                'provider_code' => $provider->provider_code,
                'claims_count' => $claimsCount,
                'approved_amount_rwf' => $approvedAmountRwf,
            ];
        });

        $generatedAt = Carbon::now('Africa/Kigali')->format('d F Y, H:i \C\A\T');
        $generatedBy = $user ? "{$user->name} (" . ucfirst($user->role) . ")" : 'System Administrator';

        // Record audit trail
        AuditLog::record(
            'export_executive_report_pdf',
            'analytics',
            null,
            ['overview' => $overview],
            $user?->id,
            $request->ip()
        );

        $pdf = Pdf::loadView('pdf.executive_report', [
            'overview' => $overview,
            'branches' => $branches,
            'departments' => $departments,
            'insurance_summary' => $insuranceSummary,
            'generated_at' => $generatedAt,
            'generated_by' => $generatedBy,
            'generated_date' => date('d M Y'),
        ])->setPaper('a4', 'portrait');

        $downloadName = 'Executive_Healthcare_Report_' . date('Y-m-d') . '.pdf';

        return $pdf->download($downloadName);
    }
}
