<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\GatedToken;
use Illuminate\Support\Str;

class GatedRouteService
{
    const int TTL_HOURS = 48;

    public static function generate(Booking $booking, ?int $ttlHours = null): GatedToken
    {
        $ttl = $ttlHours ?? self::TTL_HOURS;

        return GatedToken::create([
            'booking_id' => $booking->id,
            'token' => Str::random(64),
            'expires_at' => now()->addHours($ttl),
        ]);
    }

    public static function validate(string $token): ?GatedToken
    {
        $record = GatedToken::where('token', $token)->first();

        if (!$record || !$record->isValid()) {
            return null;
        }

        return $record;
    }

    public static function consume(string $token): ?Booking
    {
        $record = self::validate($token);
        if (!$record) return null;

        $booking = $record->booking;
        $record->markUsed();

        return $booking;
    }
}
