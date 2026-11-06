<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClaimRequest;
use App\Http\Requests\UpdateClaimStatusRequest;
use App\Http\Resources\InsuranceClaimResource;
use App\Models\InsuranceClaim;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InsuranceClaimController extends Controller
{
    /**
     * List insurance claims with multi-criteria filtering
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = InsuranceClaim::with([
            'provider',
            'patient.user',
            'invoice.items',
        ]);

        if ($user->role === 'patient') {
            if (!$user->patient) {
                return response()->json(['data' => []]);
            }
            $query->where('patient_id', $user->patient->id);
        } elseif ($request->filled('patient_id')) {
            $query->where('patient_id', $request->input('patient_id'));
        }

        if ($request->filled('provider_id')) {
            $query->provider((int) $request->input('provider_id'));
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
        $claims = $query->latest('submitted_at')->paginate($perPage);

        return InsuranceClaimResource::collection($claims)->response();
    }

    /**
     * Show single insurance claim
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $claim = InsuranceClaim::with([
            'provider',
            'patient.user',
            'invoice.items',
        ])->findOrFail($id);

        if ($user->role === 'patient' && (!$user->patient || $claim->patient_id !== $user->patient->id)) {
            return response()->json(['message' => 'Unauthorized access.'], 403);
        }

        return (new InsuranceClaimResource($claim))->response();
    }

    /**
     * Submit manual insurance claim
     */
    public function store(StoreClaimRequest $request): JsonResponse
    {
        $invoice = Invoice::with('patient')->findOrFail($request->input('invoice_id'));

        $claim = InsuranceClaim::create([
            'patient_id' => $invoice->patient_id,
            'invoice_id' => $invoice->id,
            'provider_id' => $request->input('provider_id'),
            'claim_reference' => InsuranceClaim::generateClaimReference(),
            'claimed_amount_rwf' => (float) $request->input('claimed_amount_rwf'),
            'approved_amount_rwf' => 0.00,
            'claim_status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $claim->load(['provider', 'patient.user', 'invoice']);

        return (new InsuranceClaimResource($claim))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Adjudicate claim status (under_review, approved, rejected, paid)
     */
    public function updateStatus(UpdateClaimStatusRequest $request, int $id): JsonResponse
    {
        $claim = InsuranceClaim::with(['provider', 'patient.user', 'invoice'])->findOrFail($id);
        $newStatus = $request->input('claim_status');

        switch ($newStatus) {
            case 'under_review':
                $claim->markUnderReview();
                break;
            case 'approved':
                $approvedAmount = (float) $request->input('approved_amount_rwf', $claim->claimed_amount_rwf);
                $claim->approve($approvedAmount);
                break;
            case 'rejected':
                $reason = $request->input('rejection_reason');
                $claim->reject($reason);
                break;
            case 'paid':
                $claim->markPaid();
                break;
            default:
                $claim->claim_status = $newStatus;
                $claim->save();
        }

        return (new InsuranceClaimResource($claim))->response();
    }

    /**
     * Insurance claims summary statistics for billing officers & admin
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!in_array($user->role, ['admin', 'billing_officer'])) {
            return response()->json(['message' => 'Unauthorized access.'], 403);
        }

        $totalClaims = InsuranceClaim::count();
        $totalClaimedRwf = (float) InsuranceClaim::sum('claimed_amount_rwf');
        $totalApprovedRwf = (float) InsuranceClaim::sum('approved_amount_rwf');
        $pendingCount = InsuranceClaim::whereIn('claim_status', ['draft', 'submitted', 'under_review'])->count();
        $approvedCount = InsuranceClaim::whereIn('claim_status', ['approved', 'paid'])->count();
        $rejectedCount = InsuranceClaim::where('claim_status', 'rejected')->count();

        // Breakdown by Provider
        $byProvider = DB::table('insurance_claims')
            ->join('insurance_providers', 'insurance_claims.provider_id', '=', 'insurance_providers.id')
            ->select(
                'insurance_providers.id as provider_id',
                'insurance_providers.provider_name',
                'insurance_providers.provider_code',
                DB::raw('COUNT(insurance_claims.id) as claim_count'),
                DB::raw('SUM(insurance_claims.claimed_amount_rwf) as total_claimed'),
                DB::raw('SUM(insurance_claims.approved_amount_rwf) as total_approved'),
                DB::raw('SUM(CASE WHEN insurance_claims.claim_status = "rejected" THEN 1 ELSE 0 END) as rejected_count')
            )
            ->groupBy('insurance_providers.id', 'insurance_providers.provider_name', 'insurance_providers.provider_code')
            ->get();

        return response()->json([
            'data' => [
                'total_claims' => $totalClaims,
                'total_claimed_rwf' => $totalClaimedRwf,
                'total_approved_rwf' => $totalApprovedRwf,
                'pending_claims' => $pendingCount,
                'approved_claims' => $approvedCount,
                'rejected_claims' => $rejectedCount,
                'approval_rate_percent' => $totalClaims > 0 ? round(($approvedCount / $totalClaims) * 100, 1) : 0,
                'by_provider' => $byProvider,
            ],
        ]);
    }
}
