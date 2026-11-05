<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedicineController extends Controller
{
    /**
     * List medicines with search, category filtering, and stock availability.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Medicine::query()->active();

        // Search by name, generic name, or category
        if ($term = $request->input('q') ?? $request->input('search')) {
            $query->search($term);
        }

        // Category filter
        if ($category = $request->input('category')) {
            $query->category($category);
        }

        // Stock filter
        if ($request->boolean('in_stock_only', false)) {
            $query->inStock();
        }

        $medicines = $query->orderBy('medicine_name')->get();

        return response()->json([
            'success' => true,
            'count' => $medicines->count(),
            'data' => $medicines,
        ]);
    }

    /**
     * Get unique medicine categories for filtering.
     */
    public function categories(): JsonResponse
    {
        $categories = Medicine::query()
            ->active()
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Display a specific medicine details.
     */
    public function show(int $id): JsonResponse
    {
        $medicine = Medicine::query()->find($id);

        if (!$medicine) {
            return response()->json([
                'success' => false,
                'message' => 'Medicine not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $medicine,
        ]);
    }
}
