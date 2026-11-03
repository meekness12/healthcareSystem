<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('hospital_branches')->cascadeOnDelete();
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->foreignId('specialty_id')->constrained('specialties')->cascadeOnDelete();
            $table->string('license_number')->unique();
            $table->string('consultation_room')->default('Room 101');
            $table->decimal('consultation_fee', 10, 2)->default(5000.00);
            $table->integer('max_daily_appointments')->default(10);
            $table->text('bio')->nullable();
            $table->enum('status', ['active', 'on_leave', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctors');
    }
};
