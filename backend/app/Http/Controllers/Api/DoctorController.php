<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorResource;
use App\Models\Doctor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    /**
     * Display a listing of doctors with multi-branch, department, specialty, and keyword filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Doctor::with(['user', 'branch', 'department', 'specialty', 'schedules']);

        // Filter by Hospital Branch
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->query('branch_id'));
        }

        // Filter by Department
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->query('department_id'));
        }

        // Filter by Specialty
        if ($request->filled('specialty_id')) {
            $query->where('specialty_id', $request->query('specialty_id'));
        }

        // Filter by Doctor Clinical Status
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        } else {
            // Default to showing active doctors or doctors on temporary leave
            $query->whereIn('status', ['active', 'on_leave']);
        }

        // Keyword search by doctor name or license number
        if ($request->filled('search')) {
            $search = '%' . trim($request->query('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('license_number', 'like', $search)
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', $search);
                  });
            });
        }

        $doctors = $query->get()->sortBy(function ($doc) {
            return $doc->user?->name;
        })->values();

        return response()->json([
            'success' => true,
            'count' => $doctors->count(),
            'data' => DoctorResource::collection($doctors),
        ]);
    }

    /**
     * Display the specified doctor profile.
     */
    public function show($id): JsonResponse
    {
        $doctor = Doctor::with(['user', 'branch', 'department', 'specialty', 'schedules' => function ($q) {
            $q->where('status', 'active');
        }])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new DoctorResource($doctor),
        ]);
    }
}
