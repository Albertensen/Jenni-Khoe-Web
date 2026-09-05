<?php

namespace App\Http\Controllers;

use App\Models\Schedule;

class ScheduleController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Schedule::with('booking.client')->orderBy('start_datetime')->get()->map(fn(\$s) => [
                'id' => \$s->id,
                'title' => (\$s->booking?->client?->name ?? 'Booking') . ' - ' . (\$s->booking?->service_package ?? ''),
                'start_datetime' => \$s->start_datetime,
                'end_datetime' => \$s->end_datetime,
                'status' => \$s->booking?->status ?? 'unknown',
            ]),
        ]);
    }
}
