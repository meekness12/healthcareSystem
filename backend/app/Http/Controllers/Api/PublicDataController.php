<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InsuranceProvider;
use Illuminate\Http\JsonResponse;

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
}
