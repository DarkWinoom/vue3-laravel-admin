<?php

use App\Http\Controllers\HealthController;
use App\Modules\Access\Presentation\AccessController;
use App\Modules\Audit\Presentation\AuditController;
use App\Modules\Dashboard\Presentation\DashboardController;
use App\Modules\Documentation\Presentation\DocumentationController;
use App\Modules\Identity\Presentation\AuthController;
use App\Modules\Identity\Presentation\AuthenticateSession;
use App\Modules\Identity\Presentation\TrustedOrigin;
use App\Modules\Identity\Presentation\UserController;
use App\Modules\Navigation\Presentation\MenuController;
use Illuminate\Support\Facades\Route;

Route::get('/v1/health', HealthController::class);

Route::prefix('v1')->group(function () {
    Route::middleware(TrustedOrigin::class)->group(function () {
        Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
        Route::post('auth/refresh', [AuthController::class, 'refresh'])->middleware('throttle:60,1');
    });
    Route::middleware(AuthenticateSession::class)->group(function () {
        Route::get('audit-logs', [AuditController::class, 'index']);
        Route::get('openapi', DocumentationController::class);
        Route::get('dashboard', DashboardController::class);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout'])->middleware(TrustedOrigin::class);
        Route::put('auth/profile', [AuthController::class, 'profile']);
        Route::get('navigation/routes', [MenuController::class, 'routes']);
        Route::get('users', [UserController::class, 'index']);
        Route::post('users', [UserController::class, 'save']);
        Route::put('users/{id}', [UserController::class, 'save'])->where('id', '[1-9][0-9]*');
        Route::delete('users/{id}', [UserController::class, 'destroy'])->where('id', '[1-9][0-9]*');
        Route::get('menus', [MenuController::class, 'index']);
        Route::post('menus', [MenuController::class, 'save']);
        Route::put('menus/{id}', [MenuController::class, 'save'])->where('id', '[1-9][0-9]*');
        Route::delete('menus/{id}', [MenuController::class, 'destroy'])->where('id', '[1-9][0-9]*');
        Route::get('{resource}', [AccessController::class, 'index'])->whereIn('resource', ['roles', 'permissions']);
        Route::post('{resource}', [AccessController::class, 'save'])->whereIn('resource', ['roles', 'permissions']);
        Route::put('{resource}/{id}', [AccessController::class, 'save'])->whereIn('resource', ['roles', 'permissions'])->where('id', '[1-9][0-9]*');
        Route::delete('{resource}/{id}', [AccessController::class, 'destroy'])->whereIn('resource', ['roles', 'permissions'])->where('id', '[1-9][0-9]*');
    });
});
