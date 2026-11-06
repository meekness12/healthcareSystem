<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Consultation;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\HospitalBranch;
use App\Models\InsuranceClaim;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * Executive Overview Metrics & System Counter Totals
     */
    public function overview(Request $request): JsonResponse
    {
        $totalPatients = Patient::count();
        $totalDoctors = Doctor::where('status', 'active')->count();
        $totalAppointments = Appointment::count();
        $completedAppointments = Appointment::where('status', 'completed')->count();
        $totalConsultations = Consultation::count();
        $totalInvoices = Invoice::count();

        $totalRevenueRwf = (float) Payment::where('payment_status', 'successful')->sum('amount_rwf');
        $outstandingBalancesRwf = (float) Invoice::sum('balance_rwf');
        $totalApprovedClaimsRwf = (float) InsuranceClaim::whereIn('claim_status', ['approved', 'paid'])->sum('approved_amount_rwf');
        $activeBranches = HospitalBranch::where('status', 'active')->count();

        return response()->json([
            'data' => [
                'total_patients' => $totalPatients,
                'total_doctors' => $totalDoctors,
                'total_appointments' => $totalAppointments,
                'completed_appointments' => $completedAppointments,
                'total_consultations' => $totalConsultations,
                'total_invoices' => $totalInvoices,
                'total_revenue_rwf' => $totalRevenueRwf,
                'formatted_revenue' => number_format($totalRevenueRwf) . ' RWF',
                'outstanding_balances_rwf' => $outstandingBalancesRwf,
                'formatted_outstanding' => number_format($outstandingBalancesRwf) . ' RWF',
                'total_approved_claims_rwf' => $totalApprovedClaimsRwf,
                'formatted_approved_claims' => number_format($totalApprovedClaimsRwf) . ' RWF',
                'active_branches' => $activeBranches,
            ],
        ]);
    }

    /**
     * Appointment volume trends over time formatted for Recharts (Area/Line chart)
     */
    public function appointmentTrends(Request $request): JsonResponse
    {
        $days = min(max((int) $request->input('days', 14), 7), 90);
        $branchId = $request->input('branch_id');

        $startDate = Carbon::now('Africa/Kigali')->subDays($days - 1)->startOfDay();
        $endDate = Carbon::now('Africa/Kigali')->endOfDay();

        $query = Appointment::whereBetween('appointment_date', [$startDate->toDateString(), $endDate->toDateString()]);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $appointments = $query->get(['id', 'appointment_date', 'status']);

        $grouped = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $startDate->copy()->addDays($i);
            $dateStr = $date->toDateString();
            $label = $date->format('d M');

            $dayAppointments = $appointments->where('appointment_date', $dateStr);

            $grouped[] = [
                'date' => $dateStr,
                'formatted_date' => $label,
                'total' => $dayAppointments->count(),
                'completed' => $dayAppointments->where('status', 'completed')->count(),
                'confirmed' => $dayAppointments->where('status', 'confirmed')->count(),
                'cancelled' => $dayAppointments->where('status', 'cancelled')->count(),
                'pending' => $dayAppointments->where('status', 'pending')->count(),
            ];
        }

        return response()->json(['data' => $grouped]);
    }

    /**
     * Revenue collected grouped by Hospital Branch formatted for Recharts (Bar chart)
     */
    public function revenueByBranch(Request $request): JsonResponse
    {
        $branches = HospitalBranch::all();

        // Calculate revenue per branch by linking payments -> invoices -> appointments -> branches
        $branchRevenueData = [];

        foreach ($branches as $branch) {
            $branchInvoices = Invoice::whereHas('appointment', function ($q) use ($branch) {
                $q->where('branch_id', $branch->id);
            })->get();

            $invoiceIds = $branchInvoices->pluck('id');
            $revenue = (float) Payment::whereIn('invoice_id', $invoiceIds)
                ->where('payment_status', 'successful')
                ->sum('amount_rwf');

            // If no specific appointment links exist, add direct branch patient volume estimate
            if ($revenue == 0) {
                $revenue = (float) $branchInvoices->sum('amount_paid_rwf');
            }

            $appointmentsCount = Appointment::where('branch_id', $branch->id)->count();

            $branchRevenueData[] = [
                'branch_id' => $branch->id,
                'branch_name' => $branch->branch_name,
                'short_name' => str_replace(['Hospital Branch', 'Branch', 'Hospital'], '', $branch->branch_name),
                'province' => $branch->province,
                'district' => $branch->district,
                'revenue_rwf' => $revenue,
                'formatted_revenue' => number_format($revenue) . ' RWF',
                'invoices_count' => $branchInvoices->count(),
                'appointments_count' => $appointmentsCount,
            ];
        }

        return response()->json(['data' => $branchRevenueData]);
    }

    /**
     * Consultations and clinical load grouped by Department formatted for Recharts (Pie chart)
     */
    public function departmentWorkloads(Request $request): JsonResponse
    {
        $departments = Department::withCount('doctors')->get();
        $totalConsultations = max(Consultation::count(), 1);

        $data = [];
        foreach ($departments as $dept) {
            // Count consultations conducted by doctors in this department
            $consultationCount = Consultation::whereHas('doctor', function ($q) use ($dept) {
                $q->where('department_id', $dept->id);
            })->count();

            $appointmentCount = Appointment::whereHas('doctor', function ($q) use ($dept) {
                $q->where('department_id', $dept->id);
            })->count();

            $percentage = round(($consultationCount / $totalConsultations) * 100, 1);

            $data[] = [
                'department_id' => $dept->id,
                'name' => $dept->department_name,
                'consultation_count' => $consultationCount,
                'appointment_count' => $appointmentCount,
                'doctors_count' => $dept->doctors_count,
                'percentage' => $percentage,
            ];
        }

        return response()->json(['data' => $data]);
    }

    /**
     * Key Performance Indicators (Cancellation rate, insurance approval rate, capacity)
     */
    public function kpiMetrics(Request $request): JsonResponse
    {
        $totalAppointments = Appointment::count();
        $cancelledCount = Appointment::where('status', 'cancelled')->count();
        $cancellationRate = $totalAppointments > 0 ? round(($cancelledCount / $totalAppointments) * 100, 1) : 0.0;

        $totalClaims = InsuranceClaim::count();
        $approvedClaimsCount = InsuranceClaim::whereIn('claim_status', ['approved', 'paid'])->count();
        $claimApprovalRate = $totalClaims > 0 ? round(($approvedClaimsCount / $totalClaims) * 100, 1) : 0.0;

        $totalDoctors = Doctor::where('status', 'active')->count();
        $avgDailyCapacity = Doctor::sum('max_daily_appointments');
        $bookedToday = Appointment::whereDate('appointment_date', now()->toDateString())->count();
        $capacityUtilization = $avgDailyCapacity > 0 ? round(($bookedToday / $avgDailyCapacity) * 100, 1) : 0.0;

        $avgConsultationFee = (float) Doctor::avg('consultation_fee');

        return response()->json([
            'data' => [
                'cancellation_rate_percent' => $cancellationRate,
                'claim_approval_rate_percent' => $claimApprovalRate,
                'capacity_utilization_percent' => $capacityUtilization,
                'average_consultation_fee_rwf' => round($avgConsultationFee, 2),
                'total_daily_capacity' => (int) $avgDailyCapacity,
                'booked_today' => $bookedToday,
            ],
        ]);
    }
}
