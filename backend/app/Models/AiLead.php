<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiLead extends Model
{
    protected $fillable = [
        'session_id', 'name', 'phone', 'email', 'interest', 'messages', 'source',
    ];
}
