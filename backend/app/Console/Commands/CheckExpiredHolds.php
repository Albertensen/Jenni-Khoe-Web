<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Services\BookingStateMachine;
use Illuminate\Console\Command;

class CheckExpiredHolds extends Command
{
    protected $signature = 'bookings:check-expired-holds';
    protected $description = 'Auto-expire bookings whose 48h hold period has passed';

    public function handle(BookingStateMachine $stateMachine): int
    {
        $expired = Booking::where('status', BookingStateMachine::APPROVED)
            ->where('hold_expires_at', '<=', now())
            ->get();

        $count = 0;
        foreach ($expired as $booking) {
            try {
                $stateMachine->transition($booking, BookingStateMachine::HOLD_EXPIRED, 'Hold expired (48h)');
                $count++;
            } catch (\Exception $e) {
                // Log failure but keep going
            }
        }

        $this->info("Expired {$count} holds.");
        return 0;
    }
}
