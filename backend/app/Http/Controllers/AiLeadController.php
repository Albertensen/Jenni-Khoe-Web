<?php

namespace App\Http\Controllers;

use App\Models\AiLead;

class AiLeadController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => AiLead::orderBy('id', 'desc')->get(),
        ]);
    }
}
