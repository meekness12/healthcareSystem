<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_test_types', function (Blueprint $table) {
            $table->id();
            $table->string('test_name');
            $table->string('category')->default('General');
            $table->text('description')->nullable();
            $table->decimal('price_rwf', 10, 2);
            $table->integer('turnaround_hours')->default(24);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_test_types');
    }
};
