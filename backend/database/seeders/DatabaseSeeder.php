<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin Jenni Khoe',
            'email' => 'admin@jennikhoe.com',
            'password' => bcrypt('admin123'),
        ]);
    }
}
