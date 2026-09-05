<?php

namespace App\Http\Controllers;

use App\Models\Inquiry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Routing\Controller;

class InquiryController extends Controller
{
    public function __construct()
    {
        $this->middleware('throttle:5,1')->only('store');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:100',
            'whatsapp' => 'required|string|regex:/^62\d{8,15}$/',
            'email' => 'nullable|email|max:255',
            'event_date' => 'nullable|date|after:today',
            'venue' => 'nullable|string|max:255',
            'package' => 'nullable|string|max:100',
            'guest_count' => 'nullable|integer|min:1|max:999',
            'message' => 'nullable|string|max:1000',
            'source' => 'nullable|string|in:website_chat,website_form,whatsapp,instagram|max:50',
            'consent' => 'required|boolean|accepted',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $inquiry = Inquiry::create($validator->validated());

        // Trigger notification to admin
        // Mail::to(config('app.admin_email'))->send(new NewInquiryMail($inquiry));

        return response()->json([
            'success' => true,
            'message' => 'Terima kasih! Kak Jenni akan menghubungi Anda dalam 1x24 jam via WhatsApp.',
            'data' => [
                'id' => $inquiry->id,
                'name' => $inquiry->name,
            ]
        ], 201);
    }

    public function index(Request $request)
    {
        // Admin only — akan dilindungi middleware nanti
        return Inquiry::orderBy('created_at', 'desc')->paginate(20);
    }
}
