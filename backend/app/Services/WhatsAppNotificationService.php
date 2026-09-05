<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppNotificationService
{
    private string $apiEndpoint;
    private ?string $apiKey;
    private string $phoneNumber;

    public function __construct()
    {
        $this->apiEndpoint = config('services.whatsapp.endpoint', 'https://api.whatsapp.com/send');
        $this->apiKey = config('services.whatsapp.api_key');
        $this->phoneNumber = config('services.whatsapp.phone', '6281234567890');
    }

    /**
     * Generate WhatsApp deep link with pre-filled message
     */
    public function generateDeepLink(string $phone, string $message): string
    {
        return "https://wa.me/{$phone}?text=" . urlencode($message);
    }

    /**
     * Send booking confirmation notification
     */
    public function sendBookingConfirmation(Booking $booking): string
    {
        $client = $booking->client;
        $message = "Halo {$client->name}! 🎉\n\n"
            . "Pemesanan makeup Anda telah *TERKONFIRMASI*!\n\n"
            . "📅 Tanggal: {$booking->event_date->format('d F Y')}\n"
            . "📍 Lokasi: {$booking->venue}\n"
            . "💄 Paket: {$booking->service_package}\n"
            . "💰 Total: Rp " . number_format($booking->total_amount, 0, ',', '.') . "\n"
            . "📊 Status: {$booking->status}\n\n"
            . "Kak Jenni akan merias Anda di hari spesial. 💕\n"
            . "Ada pertanyaan? Balas pesan ini ya!";

        return $this->generateDeepLink($this->phoneNumber, $message);
    }

    /**
     * Send payment reminder
     */
    public function sendPaymentReminder(Booking $booking): string
    {
        $client = $booking->client;
        $message = "Halo {$client->name},\n\n"
            . "Kami ingatkan untuk pembayaran *DP 50%* sebesar "
            . "Rp " . number_format($booking->dp_amount, 0, ',', '.') . "\n\n"
            . "Segera lakukan pembayaran untuk mengamankan jadwal Anda.\n"
            . "Link pembayaran akan dikirimkan terpisah.\n\n"
            . "Terima kasih! 🙏\n"
            . "- Jenni Khoe MUA";

        return $this->generateDeepLink($this->phoneNumber, $message);
    }

    /**
     * Send gated closing link to client
     */
    public function sendGatedLink(Booking $booking, string $token): string
    {
        $client = $booking->client;
        $gatedUrl = url("/g/{$token}");
        $message = "Halo {$client->name}!\n\n"
            . "Berikut adalah tautan pribadi Anda untuk melanjutkan proses pemesanan:\n\n"
            . "{$gatedUrl}\n\n"
            . "Tautan ini berlaku 48 jam. Silakan selesaikan:\n"
            . "1. Pilih tambahan rias\n"
            . "2. Tanda tangan SPK digital\n"
            . "3. Pembayaran DP\n\n"
            . "Terima kasih!\n"
            . "- Jenni Khoe MUA";

        return $this->generateDeepLink($this->phoneNumber, $message);
    }
}
