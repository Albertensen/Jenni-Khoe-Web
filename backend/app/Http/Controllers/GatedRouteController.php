<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Services\GatedRouteService;
use Illuminate\Http\Request;

class GatedRouteController extends Controller
{
    public function generateToken(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|integer|exists:bookings,id',
        ]);

        $booking = Booking::findOrFail($request->booking_id);

        if (!in_array($booking->status, ['approved', 'down_payment', 'paid'])) {
            return response()->json([
                'success' => false,
                'message' => 'Booking harus dalam status approved/down_payment/paid.',
            ], 422);
        }

        $token = GatedRouteService::generate($booking);

        return response()->json([
            'success' => true,
            'token' => $token->token,
            'expires_at' => $token->expires_at,
        ]);
    }
}
