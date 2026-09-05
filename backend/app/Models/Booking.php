<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\GatedToken;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id', 'service_package', 'event_date', 'venue',
        'guest_count', 'status', 'total_amount', 'dp_amount',
        'hold_expires_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'total_amount' => 'decimal:2',
            'dp_amount' => 'decimal:2',
            'hold_expires_at' => 'datetime',
        ];
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function quotation()
    {
        return $this->hasOne(Quotation::class);
    }

    public function contract()
    {
        return $this->hasOne(Contract::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function gatedTokens()
    {
        return $this->hasMany(GatedToken::class);
    }

    public function logs()
    {
        return $this->hasMany(Log::class);
    }
}