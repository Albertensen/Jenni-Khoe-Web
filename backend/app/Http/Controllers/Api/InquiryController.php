<?php

namespace App\Http\Controllers\Api;

use App\Models\Inquiry;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class InquiryController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'wedding_date' => 'required|date|after:today',
            'venue' => 'nullable|string|max:255',
            'service_package' => 'nullable|string|max:255',
            'message' => 'nullable|string|max:1000',
        ]);

        $validated['ip_address'] = $request->ip();
        $inquiry = Inquiry::create($validated);

        return response()->json($inquiry, 201);
    }

    public function index()
    {
        return Inquiry::latest()->paginate(50);
    }
}