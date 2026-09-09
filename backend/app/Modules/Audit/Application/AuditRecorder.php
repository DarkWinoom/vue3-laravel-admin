<?php

namespace App\Modules\Audit\Application;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class AuditRecorder
{
    /** Only these business fields may enter the audit store. Credentials and request payloads never do.
     * @param  array<string, mixed>  $details
     */
    public function record(string $action, ?User $actor = null, int|string|null $target = null, array $details = [], int $status = 200, ?string $errorCode = null): void
    {
        $safe = array_intersect_key($details, array_flip(['name', 'enabled', 'roleIds', 'permissionIds', 'title', 'path', 'component', 'parent_id', 'permission', 'icon', 'sort', 'passwordChanged', 'client']));
        $request = request();
        $requestId = $request->attributes->get('audit_request_id');
        if (! $requestId) {
            $requestId = (string) Str::uuid();
            $request->attributes->set('audit_request_id', $requestId);
        }
        DB::table('audit_logs')->insert([
            'request_id' => $requestId, 'actor_id' => $actor?->id, 'actor_name' => $actor?->name,
            'action' => $action, 'target_id' => $target === null ? null : (string) $target,
            'result' => $status < 400 ? 'success' : 'failure', 'status_code' => $status, 'error_code' => $errorCode,
            'details' => json_encode((object) $safe, JSON_THROW_ON_ERROR), 'occurred_at' => now(),
        ]);
    }
}
