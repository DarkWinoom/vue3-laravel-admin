<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('request_id')->index();
            $table->unsignedBigInteger('actor_id')->nullable()->index();
            $table->string('actor_name', 100)->nullable();
            $table->string('action', 100)->index();
            $table->string('target_id', 100)->nullable();
            $table->string('result', 10)->index();
            $table->unsignedSmallInteger('status_code');
            $table->string('error_code', 100)->nullable();
            $table->json('details');
            $table->timestamp('occurred_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
