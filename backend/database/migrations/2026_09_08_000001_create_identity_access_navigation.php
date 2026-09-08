<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('enabled')->default(true);
        });
        Schema::create('refresh_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('client', 10);
            $table->string('csrf_hash', 64);
            $table->timestamp('expires_at');
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });
        Schema::create('refresh_credentials', function (Blueprint $table) {
            $table->string('hash', 64)->primary();
            $table->foreignUuid('session_id')->constrained('refresh_sessions')->cascadeOnDelete();
            $table->timestamp('used_at')->nullable();
        });
        Schema::create('access_state', function (Blueprint $table) {
            $table->unsignedInteger('id')->primary();
            $table->unsignedBigInteger('version')->default(0);
        });
        DB::table('access_state')->insert(['id' => 1, 'version' => 0]);
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('menus')->restrictOnDelete();
            $table->string('name')->unique();
            $table->string('title');
            $table->string('path')->unique();
            $table->string('component');
            $table->string('permission')->nullable();
            $table->string('icon')->default('mdi:menu');
            $table->integer('sort')->default(0);
            $table->boolean('enabled')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menus');
        Schema::dropIfExists('access_state');
        Schema::dropIfExists('refresh_credentials');
        Schema::dropIfExists('refresh_sessions');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('enabled'));
    }
};
