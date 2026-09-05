<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add midtrans/xendit fields to payments table if not already there
        Schema::table('payments', function (Blueprint $table) {
            $table->string('payment_channel', 50)->nullable()->after('payment_method');
            $table->string('external_id', 100)->nullable()->unique()->after('transaction_id');
            $table->string('qr_code_url', 500)->nullable()->after('raw_webhook');
            $table->string('va_number', 50)->nullable()->after('qr_code_url');
            $table->string('bank', 30)->nullable()->after('va_number');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['payment_channel', 'external_id', 'qr_code_url', 'va_number', 'bank']);
        });
    }
};
