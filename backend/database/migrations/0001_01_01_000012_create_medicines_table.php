<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medicines', function (Blueprint $table) {
            $table->id();
            $table->string('medicine_name');
            $table->string('generic_name')->nullable();
            $table->string('category')->default('General');
            $table->string('strength')->nullable();
            $table->enum('dosage_form', ['tablet', 'syrup', 'capsule', 'injection', 'ointment', 'drops', 'inhaler'])->default('tablet');
            $table->decimal('unit_price_rwf', 10, 2);
            $table->integer('stock_quantity')->default(100);
            $table->integer('reorder_level')->default(20);
            $table->enum('status', ['active', 'discontinued'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicines');
    }
};
