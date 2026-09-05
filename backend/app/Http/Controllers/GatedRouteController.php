<?php

namespace App\Http\Controllers;

use App\Services\GatedRouteService;
use Illuminate\Http\Request;

class GatedRouteController extends Controller
{
    public function show(string $token)
    {
        // Validate token format — 64-char hex prevents injection
        if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
            return response()->json([
                'success' => false,
                'message' => 'Token tidak valid.',
            ], 404);
        }
        
        $booking = GatedRouteService::consume($token);

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Link tidak valid atau sudah kedaluwarsa.',
            ], 404);
        }

        $booking->load(['client', 'quotation', 'contract', 'payments']);

        return response()->json([
            'success' => true,
            'data' => $booking,
            'message' => 'Silakan lanjutkan ke proses closing.',
        ]);
    }

    public function validateToken(Request $request)
    {
        $request->validate(['token' => 'required|string|size:64']);

        $record = GatedRouteService::validate($request->token);

        if (!$record) {
            return response()->json([
                'valid' => false,
                'message' => 'Token tidak valid atau kedaluwarsa.',
            ]);
        }

        return response()->json([
            'valid' => true,
            'expires_at' => $record->expires_at,
        ]);
    }
}
