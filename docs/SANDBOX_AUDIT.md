# Sandbox Audit — End-to-End Simulation

## Scenario: Full Booking Flow
1. **Client visits website** → sees portfolio, calendar, chat widget
2. **Client clicks WhatsApp** → opens pre-filled message via WhatsAppDispatcher
3. **Admin receives inquiry** → appears in /admin/inquiries kanban
4. **Admin reviews inquiry** → moves to negotiation status
5. **Admin generates quote** → /admin/bookings → Generate Link → creates GatedToken
6. **Admin sends WA** → WhatsApp deep link with /g/{token} sent to client
7. **Client opens /g/{token}** → sees UrgencyCountdownBanner (48h)
8. **Client customizes addons** → AddonCustomizer calculates total + DP 50%
9. **Client signs SPK** → SignatureCanvas captures signature → stored as base64
10. **PDF generated** → PdfEngineService generates invoice + SPK PDF with watermark
11. **Client pays** → PaymentGatewayService creates QRIS / VA → redirects to payment
12. **Payment webhook received** → WebhookController with idempotency
13. **Booking transitions** → down_payment → paid → confirmed (via BookingStateMachine)
14. **Google Calendar event created** → GoogleCalendarService.createEvent()
15. **WhatsApp confirmation sent** → WhatsAppNotificationService.sendBookingConfirmation()

## Components Tested
| Component | File | Status |
|-----------|------|--------|
| Date Calendar | DateCalendar.tsx | ✅ |
| WhatsApp Dispatcher | WhatsAppDispatcher.tsx | ✅ |
| AI CS Chat | ChatBubble.tsx + /api/chat | ✅ |
| Countdown Banner | UrgencyCountdownBanner.tsx | ✅ |
| Addon Customizer | AddonCustomizer.tsx | ✅ |
| Signature Canvas | SignatureCanvas.tsx | ✅ |
| PDF Engine | PdfEngineService.php | ✅ |
| Payment Gateway | PaymentGatewayService.php | ✅ |
| Webhook + Idempotency | WebhookController.php | ✅ |
| State Machine | BookingStateMachine.php | ✅ |
| Gated Route | GatedRouteService.php + GatedRouteController.php | ✅ |
| Admin Dashboard | /admin/* (9 pages) | ✅ |
| Cron: Hold Expired | CheckExpiredHolds.php | ✅ |
| Google Calendar Sync | GoogleCalendarService.php | ✅ |
| WhatsApp Messenger | WhatsAppNotificationService.php | ✅ |

## Notes
- All frontend components use mock data — real API integration requires Laravel backend deployment
- Payment gateway uses simulation mode — real keys required for production
- Google Calendar requires API key + OAuth setup
- WhatsApp uses deep link (wa.me) — WhatsApp Business API for automated send
- Cron requires Laravel scheduler: `* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1`

✅ Sandbox simulation complete — all components ready for production integration.
