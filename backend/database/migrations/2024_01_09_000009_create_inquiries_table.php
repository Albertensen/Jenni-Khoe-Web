<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('inquiries', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 255);
            $table->string('email', 255);
            $table->string('phone', 20);
            $table->date('wedding_date');
            $table->string('venue', 255)->nullable();
            $table->string('service_package', 255)->nullable();
            $table->text('message')->nullable();
            $table->string('status', 50)->default('new');
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('wedding_date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('inquiries');
    }
};