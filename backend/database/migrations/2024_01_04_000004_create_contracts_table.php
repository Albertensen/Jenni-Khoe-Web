<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quotation_id')->constrained()->cascadeOnDelete();
            $table->string('spk_number', 50)->unique();
            $table->longText('terms_content');
            $table->longText('client_signature_data')->nullable();
            $table->string('client_signature_path', 255)->nullable();
            $table->string('signed_ip', 45)->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->string('pdf_path', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('contracts');
    }
};