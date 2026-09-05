<?php

namespace App\Http\Controllers;

use App\Models\Contract;

class ContractController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Contract::with('booking.client')->orderBy('id', 'desc')->get()->map(function ($c) {
                return [
                    'id' => $c->id,
                    'booking_id' => $c->booking_id,
                    'client_name' => $c->booking?->client?->name ?? 'N/A',
                    'spk_number' => $c->spk_number,
                    'signed_at' => $c->signed_at,
                    'signed_ip' => $c->signed_ip,
                    'status' => $c->status,
                    'pdf_path' => $c->pdf_path ? asset('storage/' . $c->pdf_path) : null,
                ];
            }),
        ]);
    }
}
