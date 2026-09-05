<?php

namespace App\Http\Controllers;

use App\Models\Payment;

class PaymentController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Payment::with('booking.client')->orderBy('id', 'desc')->get()->map(function ($p) {
                return [
                    'id' => $p->id,
                    'booking_id' => $p->booking_id,
                    'client_name' => $p->booking?->client?->name ?? 'N/A',
                    'payment_method' => $p->payment_method,
                    'amount' => (float) $p->amount,
                    'status' => $p->status,
                    'paid_at' => $p->paid_at,
                    'transaction_id' => $p->transaction_id,
                ];
            }),
        ]);
    }
}
