<?php

namespace App\Http\Controllers;

use App\Models\Booking;

class BookingController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Booking::with('client')->orderBy('event_date', 'desc')->get()->map(function ($b) {
                return [
                    'id' => $b->id,
                    'name' => $b->client?->name ?? 'N/A',
                    'event_date' => $b->event_date,
                    'service_package' => $b->service_package,
                    'total_amount' => (float) $b->total_amount,
                    'status' => $b->status,
                    'venue' => $b->venue,
                ];
            }),
        ]);
    }
}
