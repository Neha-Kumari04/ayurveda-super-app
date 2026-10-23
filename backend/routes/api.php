<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ApiController;

/*
|--------------------------------------------------------------------------
| API Routes - Ayurveda Super App
|--------------------------------------------------------------------------
| All routes under /api/v1
*/

Route::prefix('v1')->group(function () {
    // Auth & Remote Config
    Route::post('/auth/login', [ApiController::class, 'login']);
    Route::get('/config/remote', [ApiController::class, 'remoteConfig']);

    // Doctors & Slots
    Route::get('/doctors', [ApiController::class, 'getDoctors']);
    Route::get('/doctors/{id}', [ApiController::class, 'getDoctor']);
    Route::get('/doctors/{id}/slots', [ApiController::class, 'getSlots']);

    // Bookings
    Route::get('/bookings', [ApiController::class, 'getBookings']);
    Route::post('/bookings', [ApiController::class, 'createBooking']);
    Route::delete('/bookings/{id}', [ApiController::class, 'cancelBooking']);

    // Products / Shop
    Route::get('/products', [ApiController::class, 'getProducts']);
    Route::get('/products/{id}', [ApiController::class, 'getProduct']);

    // Health Records
    Route::get('/records', [ApiController::class, 'getRecords']);
    Route::get('/records/{id}', [ApiController::class, 'getRecord']);
    Route::post('/records', [ApiController::class, 'createRecord']);
});
