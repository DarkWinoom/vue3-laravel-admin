<?php

namespace App\Modules\Dashboard\Presentation;

use App\Modules\Access\Application\AccessQuery;
use App\Shared\Api;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class DashboardController
{
    public function __invoke(Request $request, AccessQuery $access): JsonResponse
    {
        return $access->snapshot(function () use ($request, $access) {
            $metrics = [];
            foreach (['users', 'roles', 'permissions', 'menus'] as $resource) {
                if ($access->allows($request->user(), $resource.'.read')) {
                    $query = DB::table($resource);
                    if (in_array($resource, ['roles', 'permissions'], true)) {
                        $query->where('guard_name', 'web');
                    }
                    $metrics[] = ['key' => $resource, 'value' => $query->count()];
                }
            }
            $canAudit = $access->allows($request->user(), 'audit.read');
            $trend = [];
            $recent = [];
            if ($canAudit) {
                $counts = DB::table('audit_logs')->selectRaw('DATE(occurred_at) as day, result, COUNT(*) as total')->where('occurred_at', '>=', now()->subDays(6)->startOfDay())->groupByRaw('DATE(occurred_at), result')->get();
                for ($i = 6; $i >= 0; $i--) {
                    $day = now()->subDays($i)->toDateString();
                    $daily = $counts->where('day', $day);
                    $trend[] = ['date' => $day, 'success' => (int) ($daily->firstWhere('result', 'success')->total ?? 0), 'failure' => (int) ($daily->firstWhere('result', 'failure')->total ?? 0)];
                }
                $recent = DB::table('audit_logs')->select(['id', 'actor_name', 'action', 'result', 'occurred_at'])->orderByDesc('id')->limit(6)->get()->all();
            }

            return Api::ok(['metrics' => $metrics, 'canAudit' => $canAudit, 'trend' => $trend, 'recent' => $recent, 'generatedAt' => now()->toIso8601String()]);
        });
    }
}
