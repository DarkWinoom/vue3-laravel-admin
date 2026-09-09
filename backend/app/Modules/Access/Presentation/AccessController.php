<?php

namespace App\Modules\Access\Presentation;

use App\Modules\Access\Application\AccessCommands;
use App\Modules\Access\Application\AccessQuery;
use App\Shared\Api;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class AccessController
{
    public function index(Request $request, AccessCommands $commands, AccessQuery $query, string $resource): JsonResponse
    {
        $commands->authorize($request->user(), $resource.'.read');
        $filters = $request->validate(['page' => 'integer|min:1', 'pageSize' => 'integer|min:1|max:100', 'search' => 'nullable|string|max:100']);

        return $query->snapshot(function () use ($resource, $filters, $query) {
            $page = DB::table($resource)->where('guard_name', 'web')->when($filters['search'] ?? null, fn ($q, $value) => $q->where('name', 'like', "%$value%"))->orderBy('id')->paginate($filters['pageSize'] ?? 20);
            $items = $page->items();
            if ($resource === 'roles') {
                foreach ($items as $item) {
                    $item->permissionIds = DB::table('role_has_permissions')->where('role_id', $item->id)->pluck('permission_id')->all();
                }
            }

            return Api::ok(['records' => $items, 'total' => $page->total(), 'page' => $page->currentPage(), 'pageSize' => $page->perPage(), 'version' => $query->version()]);
        });
    }

    public function save(AccessRequest $request, AccessCommands $commands, AccessQuery $query, string $resource, ?int $id = null): JsonResponse
    {
        $data = $request->validated();
        $id = DB::transaction(function () use ($commands, $request, $resource, $data, $id) {
            $commands->lock($data['version']);
            unset($data['version']);

            return $commands->save($resource, $data, $id, $request->user());
        });

        return Api::ok(['id' => $id, 'version' => $query->version()]);
    }

    public function destroy(Request $request, AccessCommands $commands, string $resource, int $id): JsonResponse
    {
        $data = $request->validate(['version' => 'required|integer|min:0']);
        DB::transaction(function () use ($commands, $request, $resource, $id, $data) {
            $commands->lock($data['version']);
            $commands->delete($resource, $id, $request->user());
        });

        return Api::ok();
    }
}
