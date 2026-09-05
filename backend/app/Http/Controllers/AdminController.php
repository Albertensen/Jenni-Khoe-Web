<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Inquiry;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function stats()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_inquiries' => Inquiry::count(),
                'total_bookings' => Booking::count(),
                'pending_bookings' => Booking::whereIn('status', ['inquiry', 'negotiation'])->count(),
                'confirmed_bookings' => Booking::where('status', 'confirmed')->count(),
                'total_revenue' => Booking::whereIn('status', ['paid', 'confirmed'])->sum('total_amount'),
                'upcoming_bookings' => Booking::where('event_date', '>=', now())->whereIn('status', ['approved', 'down_payment', 'paid', 'confirmed'])->count(),
            ],
        ]);
    }
}
