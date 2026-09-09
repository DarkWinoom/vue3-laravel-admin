<?php

namespace App\Modules\Dashboard\Application;

use App\Models\User;
use App\Modules\Access\Application\AccessQuery;
use Illuminate\Support\Facades\DB;

final class DashboardQuery
{
    public function __construct(private AccessQuery $access) {}

    /** @return array<string, mixed> */
    public function get(User $user): array
    {
        $access = $this->access;

        return $access->snapshot(function () use ($user, $access) {
            $metrics = [];
            foreach (['users', 'roles', 'permissions', 'menus'] as $resource) {
                if ($access->allows($user, $resource.'.read')) {
                    $query = DB::table($resource);
                    if (in_array($resource, ['roles', 'permissions'], true)) {
                        $query->where('guard_name', 'web');
                    }
                    $metrics[] = ['key' => $resource, 'value' => $query->count()];
                }
            }
            $canAudit = $access->allows($user, 'audit.read');
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

            return ['metrics' => $metrics, 'canAudit' => $canAudit, 'trend' => $trend, 'recent' => $recent, 'generatedAt' => now()->toIso8601String()];
        });
    }
}
