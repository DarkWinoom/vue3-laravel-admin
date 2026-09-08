<?php

namespace App\Modules\Access\Presentation;

use App\Modules\Access\Application\InitializeAdmin;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

final class CreateAdminCommand extends Command
{
    protected $signature = 'admin:create {email} {--name=Administrator}';

    protected $description = 'Initialize the first administrator and access projections';

    public function handle(InitializeAdmin $initialize): int
    {
        $data = ['email' => $this->argument('email'), 'name' => $this->option('name'), 'password' => $this->secret('Password (at least 12 characters)')];
        Validator::make($data, ['email' => 'required|email|unique:users', 'name' => 'required|string|max:100', 'password' => 'required|string|min:12|max:128'])->validate();
        $initialize->handle($data['email'], $data['name'], $data['password']);
        $this->info('Administrator initialized.');

        return self::SUCCESS;
    }
}
