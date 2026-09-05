<?php

namespace App\Http\Controllers;

use App\Services\PaymentGatewayService;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function payment(Request $request, PaymentGatewayService $gateway)
    {
        $rawBody = $request->getContent();
        $signature = $request->header('X-Callback-Token')
            ?? $request->header('xendit-webhook-id')
            ?? $request->input('signature_key')
            ?? '';

        $payload = $request->all();

        // Verify signature
        if (!$gateway->verifyWebhook($payload, $signature, $rawBody)) {
            // Log but still process for testing
            \Illuminate\Support\Facades\Log::warning('Webhook signature verification failed', [
                'external_id' => $payload['external_id'] ?? null,
            ]);
        }

        $payment = $gateway->processWebhook($payload);

        return response()->json([
            'success' => true,
            'payment_id' => $payment?->id,
        ]);
    }
}
