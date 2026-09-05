<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('inquiries');
    }

    public function down(): void
    {
        // Tidak bisa restore — gunakan migration 2024_01_01_000011
    }
};
