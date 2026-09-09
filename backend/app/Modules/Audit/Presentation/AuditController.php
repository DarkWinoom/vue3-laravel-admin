<?php

namespace App\Modules\Audit\Presentation;

use App\Modules\Access\Application\AccessCommands;
use App\Modules\Audit\Application\AuditQuery;
use App\Shared\Api;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

final class AuditController
{
    public function index(Request $request, AccessCommands $access, AuditQuery $query): JsonResponse
    {
        $access->authorize($request->user(), 'audit.read');
        $filters = $request->validate([
            'page' => 'integer|min:1', 'pageSize' => 'integer|min:1|max:100',
            'actor' => 'nullable|string|max:100', 'action' => 'nullable|string|max:100',
            'result' => 'nullable|in:success,failure', 'requestId' => 'nullable|uuid',
            'dateFrom' => 'nullable|date_format:Y-m-d', 'dateTo' => 'nullable|date_format:Y-m-d',
        ]);
        if (! empty($filters['dateFrom']) && ! empty($filters['dateTo']) && $filters['dateTo'] < $filters['dateFrom']) {
            throw ValidationException::withMessages(['dateTo' => '结束日期不能早于开始日期']);
        }

        return Api::ok($query->page($filters));
    }
}
