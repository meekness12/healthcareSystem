<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->string('invoice_number')->unique();
            $table->decimal('subtotal_rwf', 12, 2);
            $table->decimal('discount_rwf', 12, 2)->default(0.00);
            $table->decimal('insurance_covered_rwf', 12, 2)->default(0.00);
            $table->decimal('total_amount_rwf', 12, 2);
            $table->decimal('amount_paid_rwf', 12, 2)->default(0.00);
            $table->decimal('balance_rwf', 12, 2);
            $table->date('due_date');
            $table->enum('status', ['unpaid', 'partially_paid', 'paid', 'overdue'])->default('unpaid');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
