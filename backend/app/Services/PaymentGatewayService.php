<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Support\Str;

class PaymentGatewayService
{
    const string PROVIDER_MIDTRANS = 'midtrans';
    const string PROVIDER_XENDIT = 'xendit';

    private string $provider;
    private ?string $serverKey;
    private ?string $apiKey;

    public function __construct(string $provider = 'xendit')
    {
        $this->provider = $provider;
        $this->serverKey = config("services.{$provider}.server_key");
        $this->apiKey = config("services.{$provider}.api_key");
    }

    /**
     * Create a QRIS payment charge
     */
    public function createQrisCharge(Booking $booking, float $amount): array
    {
        $externalId = 'QRIS-' . $booking->id . '-' . Str::random(8);

        if ($this->provider === self::PROVIDER_XENDIT) {
            return $this->xenditQris($externalId, $amount, $booking);
        }

        // Midtrans fallback
        return $this->midtransSnap($externalId, $amount, $booking);
    }

    /**
     * Create a Virtual Account payment
     */
    public function createVaCharge(Booking $booking, float $amount, string $bank = 'BCA'): array
    {
        $externalId = 'VA-' . $booking->id . '-' . Str::random(8);

        if ($this->provider === self::PROVIDER_XENDIT) {
            return $this->xenditVa($externalId, $amount, $bank, $booking);
        }

        return $this->midtransSnap($externalId, $amount, $booking);
    }

    /**
     * Verify webhook signature
     */
    public function verifyWebhook(array $payload, string $signature, string $rawBody): bool
    {
        if ($this->provider === self::PROVIDER_XENDIT) {
            $computed = hash_hmac('sha256', $rawBody, $this->apiKey ?? '');
            return hash_equals($computed, $signature);
        }

        // Midtrans: SHA512(order_id+status_code+gross_amount+server_key)
        $orderId = $payload['order_id'] ?? '';
        $statusCode = $payload['status_code'] ?? '';
        $grossAmount = $payload['gross_amount'] ?? '';
        $computed = hash('sha512', $orderId . $statusCode . $grossAmount . ($this->serverKey ?? ''));
        return hash_equals($computed, $signature);
    }

    /**
     * Process webhook callback
     */
    public function processWebhook(array $payload): ?Payment
    {
        $externalId = $payload['external_id'] ?? $payload['order_id'] ?? null;
        if (!$externalId) return null;

        $payment = Payment::where('external_id', $externalId)->first();
        if (!$payment) return null;

        $status = $this->mapStatus($payload);
        $payment->update([
            'status' => $status,
            'raw_webhook' => json_encode($payload),
            'paid_at' => in_array($status, ['settled', 'paid']) ? now() : $payment->paid_at,
        ]);

        // Update booking status if settled
        if (in_array($status, ['settled', 'paid'])) {
            $booking = $payment->booking;
            if ($booking && $booking->status === 'down_payment') {
                app(BookingStateMachine::class)->transition($booking, 'paid', 'Payment settled via webhook');
            } elseif ($booking && $booking->status === 'paid') {
                app(BookingStateMachine::class)->transition($booking, 'confirmed', 'Full payment confirmed');
            }
        }

        return $payment;
    }

    // ---- Private: Xendit implementation ----
    private function xenditQris(string $externalId, float $amount, Booking $booking): array
    {
        // Simulated — real implementation would POST to Xendit API
        $payment = Payment::create([
            'booking_id' => $booking->id,
            'payment_method' => 'QRIS',
            'payment_channel' => 'xendit',
            'external_id' => $externalId,
            'transaction_id' => 'TXN-' . Str::random(16),
            'amount' => $amount,
            'fee' => round($amount * 0.007, 2), // 0.7% fee
            'status' => 'pending',
            'qr_code_url' => 'https://api.xendit.co/qr_codes/' . $externalId . '/image',
        ]);

        return [
            'success' => true,
            'payment' => $payment,
            'qr_code_url' => $payment->qr_code_url,
            'external_id' => $externalId,
        ];
    }

    private function xenditVa(string $externalId, float $amount, string $bank, Booking $booking): array
    {
        $payment = Payment::create([
            'booking_id' => $booking->id,
            'payment_method' => 'VA',
            'payment_channel' => 'xendit',
            'external_id' => $externalId,
            'transaction_id' => 'TXN-' . Str::random(16),
            'amount' => $amount,
            'fee' => round($amount * 0.04, 2), // 4% fee
            'status' => 'pending',
            'va_number' => '880' . str_pad((string) $booking->id, 12, '0', STR_PAD_LEFT),
            'bank' => $bank,
        ]);

        return [
            'success' => true,
            'payment' => $payment,
            'va_number' => $payment->va_number,
            'bank' => $bank,
            'external_id' => $externalId,
        ];
    }

    private function midtransSnap(string $externalId, float $amount, Booking $booking): array
    {
        $payment = Payment::create([
            'booking_id' => $booking->id,
            'payment_method' => 'QRIS',
            'payment_channel' => 'midtrans',
            'external_id' => $externalId,
            'transaction_id' => 'MID-' . Str::random(16),
            'amount' => $amount,
            'fee' => round($amount * 0.006, 2),
            'status' => 'pending',
        ]);

        return [
            'success' => true,
            'payment' => $payment,
            'snap_token' => 'snap-token-' . $externalId, // Simulated
            'external_id' => $externalId,
        ];
    }

    private function mapStatus(array $payload): string
    {
        $status = $payload['status'] ?? $payload['transaction_status'] ?? 'pending';
        return match (strtolower($status)) {
            'settled', 'capture', 'accept', 'success' => 'settled',
            'pending', 'authorize' => 'pending',
            'failed', 'deny', 'cancel' => 'failed',
            'expired' => 'expired',
            'refund', 'partial_refund' => 'refund',
            default => 'pending',
        };
    }
}
