
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Booking::with('client')->orderBy('event_date', 'desc')->get()->map(fn($b) => [
                'id' => $b->id,
                'name' => $b->client?->name ?? 'N/A',
                'event_date' => $b->event_date,
                'service_package' => $b->service_package,
                'total_amount' => (float) $b->total_amount,
                'status' => $b->status,
                'venue' => $b->venue,
            ]),
        ]);
    }
}
