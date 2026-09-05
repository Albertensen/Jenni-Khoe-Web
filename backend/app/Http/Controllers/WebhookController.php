<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Services\PaymentGatewayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Handle payment webhook callback with idempotency protection.
     * 
     * Idempotency: key = webhook-{external_id}-{event}-{charge_id}
     * Cache lock 300s prevents duplicate delivery processing.
     */
    public function payment(Request $request, PaymentGatewayService $gateway)
    {
        $rawBody = $request->getContent();
        $payload = $request->all();
        
        $externalId = $payload['external_id'] ?? $payload['order_id'] ?? null;
        $event = $payload['event'] ?? $payload['transaction_status'] ?? 'unknown';
        $chargeId = $payload['id'] ?? $payload['charge_id'] ?? 'unknown';
        
        if (!$externalId) {
            Log::warning('Webhook: no external_id', ['payload' => $payload]);
            return response()->json(['success' => false, 'message' => 'Missing external_id'], 422);
        }
        
        // Idempotency key
        $idempotencyKey = "webhook:{$externalId}:{$event}:{$chargeId}";
        
        // Check if already processed
        if (Cache::has($idempotencyKey)) {
            Log::info('Webhook: duplicate delivery skipped', ['key' => $idempotencyKey]);
            return response()->json(['success' => true, 'duplicate' => true]);
        }
        
        // Acquire lock (300s TTL — covers all reasonable retry windows)
        $locked = Cache::add($idempotencyKey, true, 300);
        if (!$locked) {
            return response()->json(['success' => true, 'processing' => true]);
        }
        
        // Verify HMAC-SHA256 signature
        $signature = $request->header('X-Callback-Token')
            ?? $request->header('xendit-webhook-id')
            ?? $payload['signature_key'] ?? '';
        
        $verified = $gateway->verifyWebhook($payload, $signature, $rawBody);
        if (!$verified) {
            Log::warning('Webhook: signature verification failed', ['external_id' => $externalId]);
        }
        
        // Process
        $payment = $gateway->processWebhook($payload);
        
        // Mark idempotency as fully processed (extend TTL)
        Cache::put($idempotencyKey, true, 86400); // 24h
        
        Log::info('Webhook processed', [
            'external_id' => $externalId,
            'payment_id' => $payment?->id,
            'verified' => $verified,
        ]);
        
        return response()->json([
            'success' => true,
            'payment_id' => $payment?->id,
        ]);
    }
}
