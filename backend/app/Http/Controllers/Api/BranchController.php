<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BranchRequest;
use App\Http\Resources\BranchResource;
use App\Models\HospitalBranch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    /**
     * Display a listing of hospital branches with provincial and search filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = HospitalBranch::query()->withCount(['departments', 'doctors']);

        // Province filter (e.g. Kigali City, Western Province)
        if ($request->filled('province')) {
            $query->where('province', $request->query('province'));
        }

        // District filter
        if ($request->filled('district')) {
            $query->where('district', $request->query('district'));
        }

        // Status filter (defaults to active unless specified or admin)
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        } else {
            $query->where('status', 'active');
        }

        // Search by branch name or location
        if ($request->filled('search')) {
            $search = '%' . trim($request->query('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('branch_name', 'like', $search)
                  ->orWhere('location', 'like', $search)
                  ->orWhere('district', 'like', $search);
            });
        }

        $branches = $query->orderBy('branch_name')->get();

        return response()->json([
            'success' => true,
            'data' => BranchResource::collection($branches),
        ]);
    }

    /**
     * Display the specified hospital branch with its departments.
     */
    public function show($id): JsonResponse
    {
        $branch = HospitalBranch::with(['departments' => function ($q) {
            $q->where('status', 'active')->withCount('doctors');
        }])->withCount(['departments', 'doctors'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new BranchResource($branch),
        ]);
    }

    /**
     * Store a newly created hospital branch (Admin only).
     */
    public function store(BranchRequest $request): JsonResponse
    {
        $branch = HospitalBranch::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Hospital branch created successfully.',
            'data' => new BranchResource($branch),
        ], 201);
    }

    /**
     * Update the specified hospital branch (Admin only).
     */
    public function update(BranchRequest $request, $id): JsonResponse
    {
        $branch = HospitalBranch::findOrFail($id);
        $branch->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Hospital branch updated successfully.',
            'data' => new BranchResource($branch),
        ]);
    }

    /**
     * Remove the specified hospital branch (Admin only).
     */
    public function destroy($id): JsonResponse
    {
        $branch = HospitalBranch::findOrFail($id);
        $branch->update(['status' => 'inactive']);

        return response()->json([
            'success' => true,
            'message' => 'Hospital branch deactivated successfully.',
        ]);
    }
}
