<?php

use App\Modules\Access\Application\AccessCommands;
use App\Modules\Navigation\Application\DefaultMenus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            $commands = app(AccessCommands::class);
            $commands->lock();
            $adminId = DB::table('roles')->where('name', 'admin')->where('guard_name', 'web')->value('id');
            if (! $adminId) {
                return;
            }
            foreach (['audit.read', 'docs.read'] as $name) {
                if (! DB::table('permissions')->where('name', $name)->where('guard_name', 'web')->exists()) {
                    $commands->record('permission.saved', ['id' => (int) DB::table('permissions')->max('id') + 1, 'name' => $name]);
                }
            }
            $commands->record('role.saved', ['id' => (int) $adminId, 'name' => 'admin', 'permissionIds' => DB::table('permissions')->where('guard_name', 'web')->pluck('id')->all()]);
            DefaultMenus::install();
        });
    }

    public function down(): void
    {
        // Access history is append-only. Reverting code must not discard granted permissions or audit history.
    }
};
