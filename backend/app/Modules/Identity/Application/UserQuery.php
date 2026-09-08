<?php

namespace App\Modules\Identity\Application;

use App\Models\User;
use App\Modules\Access\Application\AccessQuery;
use Illuminate\Support\Facades\DB;

final class UserQuery
{
    /** @param array<string, mixed> $filters
     * @return array<string, mixed>
     */
    public function page(array $filters): array
    {
        $page = User::query()->when($filters['search'] ?? null, fn ($q, $value) => $q->where(fn ($q) => $q->where('name', 'like', "%$value%")->orWhere('email', 'like', "%$value%")))->orderBy('id')->paginate($filters['pageSize'] ?? 20, ['*'], 'page', $filters['page'] ?? 1);
        $records = $page->map(fn (User $user) => [
            'id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'enabled' => $user->enabled,
            'roleIds' => DB::table('model_has_roles')->where('model_type', User::class)->where('model_id', $user->id)->pluck('role_id')->all(),
        ]);

        return ['records' => $records, 'total' => $page->total(), 'page' => $page->currentPage(), 'pageSize' => $page->perPage(), 'version' => app(AccessQuery::class)->version()];
    }
}
