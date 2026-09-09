<?php

namespace App\Modules\Dashboard\Presentation;

use App\Modules\Dashboard\Application\DashboardQuery;
use App\Shared\Api;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class DashboardController
{
    public function __invoke(Request $request, DashboardQuery $query): JsonResponse
    {
        return Api::ok($query->get($request->user()));
    }
}
