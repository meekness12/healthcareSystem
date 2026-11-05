<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DispensePrescriptionRequest;
use App\Http\Resources\DispensationResource;
use App\Http\Resources\PrescriptionResource;
use App\Models\AuditLog;
use App\Models\DispensationItem;
use App\Models\Medicine;
use App\Models\MedicineDispensation;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PharmacyController extends Controller
{
    /**
     * Prescriptions queue for hospital dispensary.
     */
    public function prescriptions(Request $request): JsonResponse
    {
        $query = Prescription::query()
            ->with([
                'items.medicine',
                'doctor.user',
                'doctor.specialty',
                'patient.user',
                'patient.insuranceProvider',
                'dispensations.items',
            ]);

        // Filter by status (default: issued or partially_dispensed)
        if ($status = $request->input('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        } else {
            $query->whereIn('status', ['issued', 'partially_dispensed']);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('prescription_number', 'like', "%{$search}%")
                  ->orWhereHas('patient.user', function ($qu) use ($search) {
                      $qu->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $prescriptions = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'count' => $prescriptions->count(),
            'data' => PrescriptionResource::collection($prescriptions),
        ]);
    }

    /**
     * Dispense medication items, atomically decrement stock, and update prescription status.
     */
    public function dispense(DispensePrescriptionRequest $request): JsonResponse
    {
        $user = $request->user();
        $prescription = Prescription::with(['items.medicine', 'patient.user'])->findOrFail($request->input('prescription_id'));

        if ($prescription->status === 'dispensed') {
            return response()->json([
                'success' => false,
                'message' => 'This prescription has already been fully dispensed.',
            ], 422);
        }

        if ($prescription->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot dispense medications for a cancelled prescription.',
            ], 422);
        }

        // Validate stock and quantities prior to transaction
        $itemsToDispense = $request->input('items');
        foreach ($itemsToDispense as $dispenseItem) {
            $prescriptionItem = $prescription->items->firstWhere('id', $dispenseItem['prescription_item_id']);

            if (!$prescriptionItem) {
                return response()->json([
                    'success' => false,
                    'message' => "Item ID {$dispenseItem['prescription_item_id']} does not belong to this prescription.",
                ], 422);
            }

            $remainingQuantity = $prescriptionItem->quantity_prescribed - $prescriptionItem->quantity_dispensed;
            $qty = (int) $dispenseItem['quantity_dispensed'];

            if ($qty > $remainingQuantity) {
                return response()->json([
                    'success' => false,
                    'message' => "Requested quantity ({$qty}) exceeds remaining prescribed quantity ({$remainingQuantity}) for {$prescriptionItem->medicine?->medicine_name}.",
                ], 422);
            }

            $medicine = $prescriptionItem->medicine;
            if (!$medicine || !$medicine->hasSufficientStock($qty)) {
                $avail = $medicine ? $medicine->stock_quantity : 0;
                return response()->json([
                    'success' => false,
                    'message' => "Insufficient pharmacy stock for {$medicine?->medicine_name}. Available: {$avail}, Requested: {$qty}.",
                ], 422);
            }
        }

        // Atomic transaction: Record dispensation, decrement inventory, update items
        $dispensation = DB::transaction(function () use ($request, $prescription, $user, $itemsToDispense) {
            $dispensation = MedicineDispensation::create([
                'prescription_id' => $prescription->id,
                'pharmacist_id' => $user->id,
                'dispensation_reference' => MedicineDispensation::generateDispensationReference(),
                'dispensed_at' => now(),
                'status' => 'completed',
                'notes' => $request->input('notes'),
            ]);

            foreach ($itemsToDispense as $dispenseItem) {
                $prescriptionItem = PrescriptionItem::findOrFail($dispenseItem['prescription_item_id']);
                $qty = (int) $dispenseItem['quantity_dispensed'];

                // 1. Create DispensationItem record
                DispensationItem::create([
                    'dispensation_id' => $dispensation->id,
                    'prescription_item_id' => $prescriptionItem->id,
                    'quantity_dispensed' => $qty,
                    'collection_date' => now()->format('Y-m-d'),
                ]);

                // 2. Increment quantity_dispensed on prescription_item
                $prescriptionItem->increment('quantity_dispensed', $qty);

                // 3. Decrement pharmacy warehouse stock
                Medicine::where('id', $prescriptionItem->medicine_id)->decrement('stock_quantity', $qty);
            }

            // Check if prescription is now fully dispensed or partially dispensed
            $prescription->refresh();
            $allCompleted = true;
            foreach ($prescription->items as $item) {
                if ($item->quantity_dispensed < $item->quantity_prescribed) {
                    $allCompleted = false;
                    break;
                }
            }

            $prescription->status = $allCompleted ? 'dispensed' : 'partially_dispensed';
            $prescription->save();

            // Audit Log
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'DISPENSE_MEDICATION',
                'target_table' => 'medicine_dispensations',
                'target_id' => $dispensation->id,
                'ip_address' => $request->ip(),
            ]);

            return $dispensation;
        });

        $dispensation->load(['items.prescriptionItem.medicine', 'pharmacist', 'prescription.patient.user', 'prescription.patient.insuranceProvider']);

        return response()->json([
            'success' => true,
            'message' => 'Medications dispensed and warehouse stock decremented successfully.',
            'data' => new DispensationResource($dispensation),
        ], 201);
    }

    /**
     * Pharmacy medicine stock inventory with low-stock warnings.
     */
    public function inventory(Request $request): JsonResponse
    {
        $query = Medicine::query();

        if ($term = $request->input('q') ?? $request->input('search')) {
            $query->search($term);
        }

        if ($category = $request->input('category')) {
            $query->category($category);
        }

        if ($request->boolean('low_stock_only', false)) {
            $query->lowStock();
        }

        $medicines = $query->orderBy('medicine_name')->get()->map(function ($med) {
            return [
                'id' => $med->id,
                'medicine_name' => $med->medicine_name,
                'generic_name' => $med->generic_name,
                'category' => $med->category,
                'strength' => $med->strength,
                'dosage_form' => $med->dosage_form,
                'unit_price_rwf' => (float) $med->unit_price_rwf,
                'stock_quantity' => (int) $med->stock_quantity,
                'reorder_level' => (int) $med->reorder_level,
                'is_low_stock' => $med->stock_quantity <= $med->reorder_level,
                'status' => $med->status,
            ];
        });

        return response()->json([
            'success' => true,
            'count' => $medicines->count(),
            'low_stock_count' => $medicines->where('is_low_stock', true)->count(),
            'data' => $medicines,
        ]);
    }

    /**
     * History of completed dispensations.
     */
    public function history(Request $request): JsonResponse
    {
        $dispensations = MedicineDispensation::query()
            ->with(['items.prescriptionItem.medicine', 'pharmacist', 'prescription.patient.user', 'prescription.patient.insuranceProvider'])
            ->recent()
            ->get();

        return response()->json([
            'success' => true,
            'count' => $dispensations->count(),
            'data' => DispensationResource::collection($dispensations),
        ]);
    }
}
