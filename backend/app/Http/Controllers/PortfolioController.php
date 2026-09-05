<?php

namespace App\Http\Controllers;

use App\Models\PortfolioItem;

class PortfolioController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => PortfolioItem::orderBy('sort_order')->get()->map(function ($p) {
                return [
                    'id' => $p->id,
                    'title' => $p->title,
                    'undertone' => $p->undertone,
                    'venue' => $p->venue,
                    'image_url' => $p->image_path ? asset('storage/' . $p->image_path) : null,
                    'highlighted' => (bool) $p->is_highlighted,
                ];
            }),
        ]);
    }
}
