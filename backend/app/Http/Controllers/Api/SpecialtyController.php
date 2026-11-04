<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Specialty;
use Illuminate\Http\JsonResponse;

class SpecialtyController extends Controller
{
    /**
     * Display a listing of medical specialties with doctor counts.
     */
    public function index(): JsonResponse
    {
        $specialties = Specialty::withCount('doctors')
            ->orderBy('specialty_name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $specialties,
        ]);
    }
}
