<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('service_package', 255);
            $table->date('event_date');
            $table->string('venue', 255);
            $table->unsignedInteger('guest_count')->nullable();
            $table->enum('status', ['inquiry','negotiation','approved','hold_expired','down_payment','paid','confirmed','cancelled'])->default('inquiry');
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('dp_amount', 15, 2)->default(0);
            $table->timestamp('hold_expires_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('event_date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('bookings');
    }
};