<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inquiries', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('whatsapp');
            $table->string('email')->nullable();
            $table->date('event_date')->nullable();
            $table->string('venue')->nullable();
            $table->string('package')->nullable();
            $table->integer('guest_count')->nullable();
            $table->text('message')->nullable();
            $table->string('source')->nullable();
            $table->boolean('consent')->default(false);
            $table->timestamps();
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inquiries');
    }
};
