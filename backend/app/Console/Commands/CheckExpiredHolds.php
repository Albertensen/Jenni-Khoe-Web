<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Services\BookingStateMachine;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckExpiredHolds extends Command
{
    protected $signature = 'bookings:check-expired-holds';
    protected $description = 'Auto-expire bookings whose hold period has passed';

    public function handle(BookingStateMachine $stateMachine): int
    {
        $expired = Booking::where('status', BookingStateMachine::APPROVED)
            ->where('hold_expires_at', '<=', now())
            ->get();

        $count = 0;
        foreach ($expired as $booking) {
            try {
                $stateMachine->transition($booking, BookingStateMachine::HOLD_EXPIRED, 'Auto-expired by cron');
                $count++;
                Log::info('Booking hold expired', ['booking_id' => $booking->id]);
            } catch (\Throwable $e) {
                Log::error('Failed to expire booking hold', [
                    'booking_id' => $booking->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Expired {$count} booking holds.");
        return Command::SUCCESS;
    }
}
