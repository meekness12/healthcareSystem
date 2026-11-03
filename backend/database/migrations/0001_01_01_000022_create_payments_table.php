<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->string('transaction_reference')->unique();
            $table->decimal('amount_rwf', 12, 2);
            $table->enum('payment_method', ['momo', 'airtel_money', 'card', 'cash', 'insurance'])->default('momo');
            $table->string('payer_phone')->nullable();
            $table->enum('payment_status', ['successful', 'pending', 'failed'])->default('successful');
            $table->dateTime('paid_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
