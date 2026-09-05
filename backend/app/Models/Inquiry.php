<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inquiry extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'email', 'phone', 'wedding_date', 'venue',
        'service_package', 'message', 'status', 'ip_address',
    ];

    protected function casts(): array
    {
        return ['wedding_date' => 'date'];
    }
}