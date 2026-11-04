<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DepartmentRequest;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    /**
     * Display a listing of departments, optionally filtered by branch.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Department::with('branch')->withCount('doctors');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->query('branch_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        } else {
            $query->where('status', 'active');
        }

        $departments = $query->orderBy('department_name')->get();

        return response()->json([
            'success' => true,
            'data' => DepartmentResource::collection($departments),
        ]);
    }

    /**
     * Display the specified department.
     */
    public function show($id): JsonResponse
    {
        $department = Department::with(['branch', 'doctors.user', 'doctors.specialty'])
            ->withCount('doctors')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new DepartmentResource($department),
        ]);
    }

    /**
     * Store a newly created department (Admin only).
     */
    public function store(DepartmentRequest $request): JsonResponse
    {
        $department = Department::create($request->validated());
        $department->load('branch');

        return response()->json([
            'success' => true,
            'message' => 'Department created successfully.',
            'data' => new DepartmentResource($department),
        ], 201);
    }

    /**
     * Update the specified department (Admin only).
     */
    public function update(DepartmentRequest $request, $id): JsonResponse
    {
        $department = Department::findOrFail($id);
        $department->update($request->validated());
        $department->load('branch');

        return response()->json([
            'success' => true,
            'message' => 'Department updated successfully.',
            'data' => new DepartmentResource($department),
        ]);
    }

    /**
     * Remove or deactivate department (Admin only).
     */
    public function destroy($id): JsonResponse
    {
        $department = Department::findOrFail($id);
        $department->update(['status' => 'inactive']);

        return response()->json([
            'success' => true,
            'message' => 'Department deactivated successfully.',
        ]);
    }
}
