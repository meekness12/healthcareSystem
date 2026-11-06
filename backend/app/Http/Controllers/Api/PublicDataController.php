<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InsuranceProvider;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicDataController extends Controller
{
    /**
     * Get active insurance providers in Rwanda for patient registration dropdowns.
     */
    public function insuranceProviders(): JsonResponse
    {
        $providers = InsuranceProvider::where('status', 'active')
            ->select('id', 'provider_name', 'provider_code', 'coverage_percentage_default')
            ->orderBy('provider_name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $providers,
        ]);
    }

    /**
     * Get active patients list with insurance details for staff and billing dropdowns.
     */
    public function patients(Request $request): JsonResponse
    {
        $query = Patient::with(['user', 'insuranceProvider']);

        if ($request->filled('search')) {
            $search = '%' . trim($request->query('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('national_id', 'like', $search)
                  ->orWhere('patient_number', 'like', $search)
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', $search)
                         ->orWhere('phone', 'like', $search);
                  });
            });
        }

        $patients = $query->latest()->take(100)->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'patient_number' => $p->patient_number,
                'name' => $p->user?->name ?? 'Unknown Patient',
                'email' => $p->user?->email,
                'phone' => $p->user?->phone,
                'national_id' => $p->national_id,
                'insurance_provider_id' => $p->insurance_provider_id,
                'insurance_provider_name' => $p->insuranceProvider?->provider_name,
                'coverage_percentage' => (float) ($p->insuranceProvider?->coverage_percentage_default ?? 0),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $patients,
        ]);
    }
}
