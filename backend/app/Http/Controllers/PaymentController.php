<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Services\PaymentGatewayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    public function createQris(Request $request, PaymentGatewayService $gateway)
    {
        $validator = Validator::make($request->all(), [
            'booking_id' => 'required|exists:bookings,id',
            'amount' => 'required|numeric|min:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $booking = Booking::findOrFail($request->booking_id);
        $result = $gateway->createQrisCharge($booking, $request->amount);

        return response()->json($result);
    }

    public function createVa(Request $request, PaymentGatewayService $gateway)
    {
        $validator = Validator::make($request->all(), [
            'booking_id' => 'required|exists:bookings,id',
            'amount' => 'required|numeric|min:1000',
            'bank' => 'nullable|string|in:BCA,BNI,BRI,MANDIRI,PERMATA',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $booking = Booking::findOrFail($request->booking_id);
        $result = $gateway->createVaCharge($booking, $request->amount, $request->bank ?? 'BCA');

        return response()->json($result);
    }
}
