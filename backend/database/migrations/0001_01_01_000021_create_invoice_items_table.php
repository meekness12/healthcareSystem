<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->string('item_description');
            $table->enum('item_type', ['consultation', 'lab_test', 'medicine', 'procedure', 'other'])->default('consultation');
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price_rwf', 12, 2);
            $table->decimal('total_price_rwf', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};
