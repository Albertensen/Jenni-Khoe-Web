<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleCalendarService
{
    private ?string $apiKey;
    private string $calendarId;

    public function __construct()
    {
        $this->apiKey = config('services.google.calendar_api_key');
        $this->calendarId = config('services.google.calendar_id', 'primary');
    }

    /**
     * Check for time slot conflicts via FreeBusy API
     */
    public function checkFreeBusy(string $startDateTime, string $endDateTime): array
    {
        if (!$this->apiKey) {
            Log::warning('Google Calendar API key not configured');
            return ['available' => true, 'error' => 'API key missing'];
        }

        $response = Http::post(
            "https://www.googleapis.com/calendar/v3/calendars/{$this->calendarId}/freeBusy?key={$this->apiKey}",
            [
                'timeMin' => $startDateTime,
                'timeMax' => $endDateTime,
                'items' => [['id' => $this->calendarId]],
            ]
        );

        if (!$response->successful()) {
            Log::error('FreeBusy API failed', ['response' => $response->body()]);
            return ['available' => true, 'error' => 'API request failed'];
        }

        $data = $response->json();
        $busy = $data['calendars'][$this->calendarId]['busy'] ?? [];

        return [
            'available' => empty($busy),
            'busy_slots' => $busy,
        ];
    }

    /**
     * Create Google Calendar event for a confirmed booking
     */
    public function createEvent(Booking $booking): ?string
    {
        if (!$this->apiKey) return null;

        $event = [
            'summary' => "MUA - {$booking->client->name} ({$booking->service_package})",
            'description' => "Venue: {$booking->venue}\nPaket: {$booking->service_package}\nStatus: {$booking->status}",
            'start' => [
                'dateTime' => $booking->event_date->format('Y-m-d') . 'T08:00:00',
                'timeZone' => 'Asia/Jakarta',
            ],
            'end' => [
                'dateTime' => $booking->event_date->format('Y-m-d') . 'T18:00:00',
                'timeZone' => 'Asia/Jakarta',
            ],
            'reminders' => [
                'useDefault' => false,
                'overrides' => [
                    ['method' => 'email', 'minutes' => 24 * 60],
                    ['method' => 'popup', 'minutes' => 60],
                ],
            ],
        ];

        $response = Http::post(
            "https://www.googleapis.com/calendar/v3/calendars/{$this->calendarId}/events?key={$this->apiKey}",
            $event
        );

        if ($response->successful()) {
            $data = $response->json();
            $eventId = $data['id'] ?? null;
            $htmlLink = $data['htmlLink'] ?? null;

            // Update booking schedule record
            $booking->schedules()->create([
                'start_datetime' => $booking->event_date->format('Y-m-d 08:00:00'),
                'end_datetime' => $booking->event_date->format('Y-m-d 18:00:00'),
                'google_event_id' => $eventId,
                'google_event_link' => $htmlLink,
                'sync_at' => now(),
            ]);

            Log::info('Google Calendar event created', [
                'booking_id' => $booking->id,
                'event_id' => $eventId,
            ]);

            return $eventId;
        }

        Log::error('Failed to create Google Calendar event', [
            'booking_id' => $booking->id,
            'response' => $response->body(),
        ]);

        return null;
    }
}
