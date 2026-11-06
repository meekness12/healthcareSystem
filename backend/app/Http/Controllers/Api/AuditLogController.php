<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * List security audit logs with multi-field filtering
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('user');

        if ($request->filled('action')) {
            $query->action($request->input('action'));
        }

        if ($request->filled('user_id')) {
            $query->user((int) $request->input('user_id'));
        }

        if ($request->filled('target_table')) {
            $query->target($request->input('target_table'));
        }

        if ($request->filled('from_date') || $request->filled('to_date')) {
            $query->dateRange($request->input('from_date'), $request->input('to_date'));
        }

        if ($request->filled('search')) {
            $query->search($request->input('search'));
        }

        $perPage = min((int) $request->input('per_page', 25), 100);
        $logs = $query->latest()->paginate($perPage);

        return AuditLogResource::collection($logs)->response();
    }

    /**
     * Show single audit log entry
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $log = AuditLog::with('user')->findOrFail($id);
        return (new AuditLogResource($log))->response();
    }
}
