<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event', 100);
            $table->json('payload')->nullable();
            $table->string('actor', 100)->nullable();
            $table->timestamps();

            $table->index('event');
            $table->index(['booking_id', 'event']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('logs');
    }
};