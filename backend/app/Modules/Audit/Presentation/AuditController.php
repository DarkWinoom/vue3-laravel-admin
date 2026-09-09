<?php

namespace App\Modules\Audit\Presentation;

use App\Modules\Access\Application\AccessCommands;
use App\Shared\Api;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class AuditController
{
    public function index(Request $request, AccessCommands $access): JsonResponse
    {
        $access->authorize($request->user(), 'audit.read');
        $filters = $request->validate([
            'page' => 'integer|min:1', 'pageSize' => 'integer|min:1|max:100',
            'actor' => 'nullable|string|max:100', 'action' => 'nullable|string|max:100',
            'result' => 'nullable|in:success,failure', 'requestId' => 'nullable|uuid',
            'dateFrom' => 'nullable|date_format:Y-m-d', 'dateTo' => 'nullable|date_format:Y-m-d|after_or_equal:dateFrom',
        ]);
        $page = DB::table('audit_logs')
            ->when($filters['actor'] ?? null, fn ($q, $value) => $q->where('actor_name', 'like', "%$value%"))
            ->when($filters['action'] ?? null, fn ($q, $value) => $q->where('action', 'like', "%$value%"))
            ->when($filters['result'] ?? null, fn ($q, $value) => $q->where('result', $value))
            ->when($filters['requestId'] ?? null, fn ($q, $value) => $q->where('request_id', $value))
            ->when($filters['dateFrom'] ?? null, fn ($q, $value) => $q->where('occurred_at', '>=', $value.' 00:00:00'))
            ->when($filters['dateTo'] ?? null, fn ($q, $value) => $q->where('occurred_at', '<', Carbon::parse($value)->addDay()))
            ->orderByDesc('id')->paginate($filters['pageSize'] ?? 20);
        $rows = array_map(function ($row) {
            $row->details = json_decode($row->details, false, 512, JSON_THROW_ON_ERROR);

            return $row;
        }, $page->items());

        return Api::ok(['records' => $rows, 'total' => $page->total(), 'page' => $page->currentPage(), 'pageSize' => $page->perPage()]);
    }
}
