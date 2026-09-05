<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PortfolioItem extends Model
{
    protected $fillable = [
        'title', 'undertone', 'venue', 'image_path', 'is_highlighted', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_highlighted' => 'boolean',
        ];
    }
}
