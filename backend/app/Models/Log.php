<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Log extends Model
{
    use HasFactory;

    protected $fillable = ['booking_id', 'event', 'payload', 'actor'];

    protected function casts(): array
    {
        return ['payload' => 'array'];
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}