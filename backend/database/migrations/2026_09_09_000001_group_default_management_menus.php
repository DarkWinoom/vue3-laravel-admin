<?php

use App\Modules\Navigation\Application\DefaultMenus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Empty databases receive their menus when the first administrator is created.
        if (DB::table('menus')->whereNull('parent_id')->whereIn('name', array_keys(DefaultMenus::ITEMS))->exists()) {
            DB::transaction(function () {
                DB::table('access_state')->where('id', 1)->lockForUpdate()->first();
                DefaultMenus::install();
                DB::table('access_state')->where('id', 1)->increment('version');
            });
        }
    }

    public function down(): void
    {
        DB::transaction(function () {
            foreach (DefaultMenus::ITEMS as $resource => [$name]) {
                DB::table('menus')->where('name', $name)->where('component', $resource)->update(['parent_id' => null, 'name' => $resource, 'path' => '/'.$resource]);
            }
            $group = DB::table('menus')->where('name', 'manage')->value('id');
            if ($group && ! DB::table('menus')->where('parent_id', $group)->exists()) {
                DB::table('menus')->where('id', $group)->delete();
            }
        });
    }
};
