<?php

namespace App\Modules\Identity\Presentation;

use App\Modules\Access\Application\AccessCommands;
use App\Modules\Access\Application\AccessQuery;
use App\Modules\Identity\Application\UserCommands;
use App\Modules\Identity\Application\UserQuery;
use App\Shared\Api;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class UserController
{
    public function index(Request $request, AccessCommands $commands, AccessQuery $access): JsonResponse
    {
        $commands->authorize($request->user(), 'users.read');
        $filters = $request->validate(['page' => 'integer|min:1', 'pageSize' => 'integer|min:1|max:100', 'search' => 'nullable|string|max:100', 'name' => 'nullable|string|max:100', 'email' => 'nullable|string|max:255', 'enabled' => 'nullable|boolean']);

        return $access->snapshot(fn () => Api::ok(app(UserQuery::class)->page($filters)));
    }

    public function save(UserRequest $request, AccessCommands $commands, AccessQuery $access, ?int $id = null): JsonResponse
    {
        $data = $request->validated();
        $user = app(UserCommands::class)->save($request->user(), $data, $id);

        return Api::ok(['id' => $user->id, 'version' => $access->version()]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['version' => 'required|integer|min:0']);
        app(UserCommands::class)->delete($request->user(), $id, $data['version']);

        return Api::ok();
    }
}
