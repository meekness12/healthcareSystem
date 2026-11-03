<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('hospital_branches')->cascadeOnDelete();
            $table->string('booking_reference')->unique();
            $table->date('appointment_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->enum('appointment_type', ['general', 'specialist', 'follow_up', 'emergency'])->default('general');
            $table->boolean('is_emergency')->default(false);
            $table->enum('status', ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'])->default('pending');
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            // Strict double-booking prevention constraint
            $table->unique(['doctor_id', 'appointment_date', 'start_time'], 'uq_doctor_date_slot');
            $table->index(['patient_id', 'appointment_date']);
            $table->index(['doctor_id', 'appointment_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
