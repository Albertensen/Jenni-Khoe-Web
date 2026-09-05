<?php

use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\InquiryController;
use Illuminate\Support\Facades\Route;

Route::get('/available-dates', [BookingController::class, 'availableDates']);

Route::apiResource('clients', ClientController::class);
Route::apiResource('bookings', BookingController::class)->except(['edit', 'create']);
Route::post('/inquiries', [InquiryController::class, 'store']);
Route::get('/inquiries', [InquiryController::class, 'index'])->middleware('auth:sanctum');
// Phase 5 - Gated Route & State Machine
Route::get('/g/{token}', [App\Http\Controllers\GatedRouteController::class, 'show']);
Route::post('/g/validate', [App\Http\Controllers\GatedRouteController::class, 'validateToken']);

// Phase 6 - Payment & Webhook
Route::post('/webhooks/payment', [App\Http\Controllers\WebhookController::class, 'payment'])->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);
Route::post('/payments/qris', [App\Http\Controllers\PaymentController::class, 'createQris']);
Route::post('/payments/va', [App\Http\Controllers\PaymentController::class, 'createVa']);
Route::post('/generate-gated-link', [App\Http\Controllers\GatedRouteController::class, 'generateToken']);

// Sanctum Auth
use App\Http\Controllers\Api\AuthController;
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
Route::get('/admin/stats', [App\Http\Controllers\AdminController::class, 'stats']);
// Admin data endpoints
Route::get('/inquiries', [App\Http\Controllers\InquiryController::class, 'index']);
Route::get('/bookings', [App\Http\Controllers\BookingController::class, 'index']);
Route::get('/payments', [App\Http\Controllers\PaymentController::class, 'index']);
Route::get('/contracts', [App\Http\Controllers\ContractController::class, 'index']);
Route::get('/ai-leads', [App\Http\Controllers\AiLeadController::class, 'index']);
Route::get('/portfolio', [App\Http\Controllers\PortfolioController::class, 'index']);
Route::get('/schedules', [App\Http\Controllers\ScheduleController::class, 'index']);
