<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dispensation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dispensation_id')->constrained('medicine_dispensations')->cascadeOnDelete();
            $table->foreignId('prescription_item_id')->constrained('prescription_items')->cascadeOnDelete();
            $table->integer('quantity_dispensed');
            $table->date('collection_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dispensation_items');
    }
};
