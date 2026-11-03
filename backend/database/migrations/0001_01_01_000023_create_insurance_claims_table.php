<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('insurance_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->foreignId('provider_id')->constrained('insurance_providers')->cascadeOnDelete();
            $table->string('claim_reference')->unique();
            $table->decimal('claimed_amount_rwf', 12, 2);
            $table->decimal('approved_amount_rwf', 12, 2)->default(0.00);
            $table->enum('claim_status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid'])->default('submitted');
            $table->text('rejection_reason')->nullable();
            $table->dateTime('submitted_at');
            $table->dateTime('processed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('insurance_claims');
    }
};
