<?php

namespace App\Http\Controllers\Api;

use App\Models\Booking;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class BookingController extends Controller
{
    public function index()
    {
        return Booking::with('client')->latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'service_package' => 'required|string|max:255',
            'event_date' => 'required|date|after:today',
            'venue' => 'required|string|max:255',
            'guest_count' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ]);
        $validated['status'] = 'inquiry';

        return Booking::create($validated);
    }

    public function show(Booking $booking)
    {
        return $booking->load(['client', 'quotation', 'contract', 'payments', 'schedules']);
    }

    public function update(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'service_package' => 'sometimes|string|max:255',
            'event_date' => 'sometimes|date',
            'venue' => 'sometimes|string|max:255',
            'guest_count' => 'nullable|integer|min:1',
            'status' => 'sometimes|in:inquiry,negotiation,approved,hold_expired,down_payment,paid,confirmed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $booking->update($validated);
        return $booking;
    }

    public function destroy(Booking $booking)
    {
        $booking->delete();
        return response()->noContent();
    }

    public function availableDates(Request $request)
    {
        $request->validate(['month' => 'required|integer|between:1,12', 'year' => 'required|integer|min:2024']);
        $booked = Booking::whereMonth('event_date', $request->month)
            ->whereYear('event_date', $request->year)
            ->whereIn('status', ['approved', 'down_payment', 'paid', 'confirmed'])
            ->pluck('event_date');

        return response()->json(['booked_dates' => $booked]);
    }
}