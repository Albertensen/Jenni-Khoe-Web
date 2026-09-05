<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('quotations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->string('quote_number', 50)->unique();
            $table->json('base_items');
            $table->json('selected_addons')->nullable();
            $table->decimal('subtotal', 15, 2);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2);
            $table->decimal('dp_required', 15, 2);
            $table->timestamp('valid_until')->nullable();
            $table->enum('status', ['draft','sent','accepted','expired'])->default('draft');
            $table->string('pdf_path', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('quotations');
    }
};