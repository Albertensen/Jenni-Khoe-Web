<?php

namespace App\Services;

use App\Models\Booking;
use App\Services\GoogleCalendarService;
use App\Services\WhatsAppNotificationService;
use InvalidArgumentException;

class BookingStateMachine
{
    const string INQUIRY = 'inquiry';
    const string NEGOTIATION = 'negotiation';
    const string APPROVED = 'approved';
    const string HOLD_EXPIRED = 'hold_expired';
    const string DOWN_PAYMENT = 'down_payment';
    const string PAID = 'paid';
    const string CONFIRMED = 'confirmed';
    const string CANCELLED = 'cancelled';

    private static array $transitions = [
        self::INQUIRY => [self::NEGOTIATION, self::CANCELLED],
        self::NEGOTIATION => [self::APPROVED, self::INQUIRY, self::CANCELLED],
        self::APPROVED => [self::DOWN_PAYMENT, self::HOLD_EXPIRED, self::CANCELLED],
        self::HOLD_EXPIRED => [self::INQUIRY], // Revert to inquiry after hold expires
        self::DOWN_PAYMENT => [self::PAID, self::CANCELLED],
        self::PAID => [self::CONFIRMED, self::CANCELLED],
        self::CONFIRMED => [self::CANCELLED], // Only cancellation from confirmed
        self::CANCELLED => [],                // Final state — no transitions out
    ];

    public static function allowedTransitions(?string $currentStatus): array
    {
        return self::$transitions[$currentStatus] ?? [];
    }

    public static function canTransition(string $currentStatus, string $newStatus): bool
    {
        return in_array($newStatus, self::allowedTransitions($currentStatus), true);
    }

    public static function transition(Booking $booking, string $newStatus, ?string $note = null): Booking
    {
        if (!self::canTransition($booking->status, $newStatus)) {
            throw new InvalidArgumentException(
                "Transisi status tidak valid: {$booking->status} -> {$newStatus}. " .
                "Transisi yang diizinkan: " . implode(', ', self::allowedTransitions($booking->status))
            );
        }

        $oldStatus = $booking->status;
        $booking->status = $newStatus;

        if ($newStatus === self::APPROVED) {
            $booking->hold_expires_at = now()->addHours(48); // 48h hold
        }

        if ($newStatus === self::DOWN_PAYMENT || $newStatus === self::PAID) {
            $booking->hold_expires_at = null; // Clear hold once payment starts
        }

        if ($newStatus === self::CONFIRMED) {
            $booking->hold_expires_at = null;
        }

        $booking->save();

        // Log transition
        $booking->logs()->create([
            'event' => "status:{$oldStatus}->{$newStatus}",
            'payload' => json_encode(['note' => $note, 'previous_status' => $oldStatus]),
            'actor' => 'system',
        ]);

        // Auto-trigger side effects
        try {
            if ($newStatus === self::APPROVED) {
                // Send gated link via WhatsApp
                $whatsapp = app(WhatsAppNotificationService::class);
                $whatsapp->sendGatedLink($booking);
            }

            if ($newStatus === self::DOWN_PAYMENT) {
                // Send payment reminder
                $whatsapp = app(WhatsAppNotificationService::class);
                $whatsapp->sendPaymentReminder($booking);
            }

            if ($newStatus === self::CONFIRMED) {
                // Create Google Calendar event
                $calendar = app(GoogleCalendarService::class);
                $event = $calendar->createEvent($booking);

                // Sync schedule record
                if ($event && isset($event['id'])) {
                    $booking->schedules()->create([
                        'start_datetime' => $booking->event_date,
                        'end_datetime' => $booking->event_date,
                        'google_event_id' => $event['id'],
                        'google_event_link' => $event['htmlLink'] ?? null,
                        'synced_at' => now(),
                    ]);
                }

                // Send confirmation WhatsApp
                $whatsapp = app(WhatsAppNotificationService::class);
                $whatsapp->sendBookingConfirmation($booking);
            }
        } catch (\Exception $e) {
            // Log side-effect failure but dont block the transition
            $booking->logs()->create([
                'event' => 'side_effect_failed',
                'payload' => json_encode(['error' => $e->getMessage()]),
                'actor' => 'system',
            ]);
        }

        return $booking;
    }
}
