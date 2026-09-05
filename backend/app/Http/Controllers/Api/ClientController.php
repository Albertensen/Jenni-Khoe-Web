<?php

namespace App\Http\Controllers\Api;

use App\Models\Client;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class ClientController extends Controller
{
    public function index()
    {
        return Client::with('bookings')->latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'instagram_handle' => 'nullable|string|max:255',
            'wedding_date' => 'nullable|date',
            'venue' => 'nullable|string|max:255',
            'guest_count' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        return Client::create($validated);
    }

    public function show(Client $client)
    {
        return $client->load('bookings');
    }

    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'phone' => 'sometimes|string|max:20',
            'instagram_handle' => 'nullable|string|max:255',
            'wedding_date' => 'nullable|date',
            'venue' => 'nullable|string|max:255',
            'guest_count' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        $client->update($validated);
        return $client;
    }

    public function destroy(Client $client)
    {
        $client->delete();
        return response()->noContent();
    }
}