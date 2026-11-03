<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('patient_number')->unique();
            $table->date('dob')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->default('other');
            $table->string('national_id', 20)->nullable()->unique();
            $table->string('address')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->foreignId('insurance_provider_id')->nullable()->constrained('insurance_providers')->nullOnDelete();
            $table->string('insurance_number')->nullable();
            $table->text('allergies')->nullable();
            $table->text('medical_history')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
