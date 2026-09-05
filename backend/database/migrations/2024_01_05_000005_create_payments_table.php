<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->enum('payment_method', ['QRIS','VA','credit_card']);
            $table->string('transaction_id', 255)->unique();
            $table->decimal('amount', 15, 2);
            $table->decimal('fee', 15, 2)->default(0);
            $table->enum('status', ['pending','settled','failed','expired','refund'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->string('xendit_charge_id', 255)->nullable();
            $table->json('raw_webhook')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('payments');
    }
};