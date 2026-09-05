<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quotation extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id', 'quote_number', 'base_items', 'selected_addons',
        'subtotal', 'discount', 'grand_total', 'dp_required',
        'valid_until', 'status', 'pdf_path',
    ];

    protected function casts(): array
    {
        return [
            'base_items' => 'array',
            'selected_addons' => 'array',
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'dp_required' => 'decimal:2',
            'valid_until' => 'datetime',
        ];
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function contract()
    {
        return $this->hasOne(Contract::class);
    }
}