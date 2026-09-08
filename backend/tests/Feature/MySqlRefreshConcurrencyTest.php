<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Identity\Application\SessionService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use Tests\TestCase;

final class MySqlRefreshConcurrencyTest extends TestCase
{
    public function test_two_refresh_workers_cannot_consume_the_same_credential(): void
    {
        if (config('database.default') !== 'mysql') {
            $this->markTestSkipped('Requires the dedicated MySQL testing database.');
        }
        Artisan::call('migrate:fresh', ['--force' => true]);
        $user = User::create(['name' => 'Race', 'email' => 'race@example.test', 'password' => 'Concurrency-test-password!']);
        $tokens = app(SessionService::class)->login($user->email, 'Concurrency-test-password!', 'desktop');
        $credentialFile = tempnam(sys_get_temp_dir(), 'refresh-test-');
        file_put_contents($credentialFile, $tokens['refreshToken']);
        $workers = [];
        DB::beginTransaction();
        User::whereKey($user->id)->lockForUpdate()->first();
        try {
            for ($i = 0; $i < 2; $i++) {
                $process = new Process([PHP_BINARY, '-d', 'xdebug.mode=off', __DIR__.'/../Fixtures/refresh-worker.php', $credentialFile], base_path(), null, null, 30);
                $process->start();
                $workers[] = $process;
            }
            foreach ($workers as $process) {
                $ready = str_contains($process->getOutput(), 'READY') || $process->waitUntil(fn ($type, $output) => str_contains($output, 'READY'));
                $this->assertTrue($ready, $process->getErrorOutput());
            }
            // Both workers contend on the same user lock before consuming the credential.
            usleep(200000);
            DB::commit();
            $outputs = [];
            foreach ($workers as $process) {
                $process->wait();
                $this->assertTrue($process->isSuccessful(), $process->getErrorOutput());
                $outputs[] = trim(str_replace('READY', '', $process->getOutput()));
            }
            sort($outputs);
            $this->assertSame(['OK', 'SESSION_REVOKED'], $outputs);
            $this->assertSame(0, DB::table('refresh_sessions')->whereNull('revoked_at')->count());
        } finally {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            foreach ($workers as $process) {
                $process->stop();
            }
            unlink($credentialFile);
            Artisan::call('migrate:fresh', ['--force' => true]);
        }
    }
}
