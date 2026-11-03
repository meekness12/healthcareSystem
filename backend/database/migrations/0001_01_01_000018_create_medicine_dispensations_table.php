<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medicine_dispensations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained('prescriptions')->cascadeOnDelete();
            $table->foreignId('pharmacist_id')->constrained('users')->cascadeOnDelete();
            $table->string('dispensation_reference')->unique();
            $table->dateTime('dispensed_at');
            $table->enum('status', ['completed', 'partial'])->default('completed');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicine_dispensations');
    }
};
