<?php

namespace App\Shared;

use Illuminate\Http\JsonResponse;

final class Api
{
    public static function ok(mixed $data = null, int $status = 200): JsonResponse
    {
        return response()->json(['code' => '0000', 'msg' => '成功', 'data' => $data], $status);
    }
}
