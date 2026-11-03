<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hospital_branches', function (Blueprint $table) {
            $table->id();
            $table->string('branch_name');
            $table->string('province')->nullable();
            $table->string('district')->nullable();
            $table->string('location')->nullable();
            $table->string('address')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hospital_branches');
    }
};
