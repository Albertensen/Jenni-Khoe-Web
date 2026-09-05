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
