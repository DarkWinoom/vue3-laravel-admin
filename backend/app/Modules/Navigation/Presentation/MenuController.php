<?php

namespace App\Modules\Navigation\Presentation;

use App\Modules\Access\Application\AccessCommands;
use App\Modules\Access\Application\AccessQuery;
use App\Modules\Navigation\Application\MenuCommands;
use App\Modules\Navigation\Application\MenuQuery;
use App\Shared\Api;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class MenuController
{
    public function routes(Request $request, MenuQuery $query): JsonResponse
    {
        return Api::ok($query->routes($request->user()));
    }

    public function index(Request $request, AccessCommands $commands, AccessQuery $query): JsonResponse
    {
        $commands->authorize($request->user(), 'menus.read');
        $data = $request->validate(['page' => 'integer|min:1', 'pageSize' => 'integer|min:1|max:100', 'search' => 'nullable|string|max:100']);

        return $query->snapshot(function () use ($data, $query) {
            $page = DB::table('menus')->when($data['search'] ?? null, fn ($q, $value) => $q->where('title', 'like', "%$value%"))->orderBy('sort')->orderBy('id')->paginate($data['pageSize'] ?? 20);

            return Api::ok(['records' => $page->items(), 'total' => $page->total(), 'page' => $page->currentPage(), 'pageSize' => $page->perPage(), 'version' => $query->version()]);
        });
    }

    public function save(MenuRequest $request, AccessCommands $commands, ?int $id = null): JsonResponse
    {
        $data = $request->validated();
        $id = app(MenuCommands::class)->save($request->user(), $data, $id);

        return Api::ok(['id' => $id]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['version' => 'required|integer|min:0']);
        app(MenuCommands::class)->delete($request->user(), $id, $data['version']);

        return Api::ok();
    }
}
