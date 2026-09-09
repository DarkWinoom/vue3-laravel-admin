<?php

namespace App\Modules\Audit\Application;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

final class AuditQuery
{
    /** @param array<string, mixed> $filters
     * @return array<string, mixed>
     */
    public function page(array $filters): array
    {
        $page = DB::table('audit_logs')
            ->when($filters['actor'] ?? null, fn ($q, $value) => $q->where('actor_name', 'like', "%$value%"))
            ->when($filters['action'] ?? null, fn ($q, $value) => $q->where('action', 'like', "%$value%"))
            ->when($filters['result'] ?? null, fn ($q, $value) => $q->where('result', $value))
            ->when($filters['requestId'] ?? null, fn ($q, $value) => $q->where('request_id', $value))
            ->when($filters['dateFrom'] ?? null, fn ($q, $value) => $q->where('occurred_at', '>=', $value.' 00:00:00'))
            ->when($filters['dateTo'] ?? null, fn ($q, $value) => $q->where('occurred_at', '<', Carbon::parse($value)->addDay()))
            ->orderByDesc('id')->paginate($filters['pageSize'] ?? 20, ['*'], 'page', $filters['page'] ?? 1);
        $rows = array_map(function ($row) {
            $row->details = json_decode($row->details, false, 512, JSON_THROW_ON_ERROR);

            return $row;
        }, $page->items());

        return ['records' => $rows, 'total' => $page->total(), 'page' => $page->currentPage(), 'pageSize' => $page->perPage()];
    }
}
