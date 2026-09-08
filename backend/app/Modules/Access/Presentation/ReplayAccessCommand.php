<?php

namespace App\Modules\Access\Presentation;

use App\Modules\Access\Application\AccessCommands;
use App\Modules\Access\Domain\AccessAggregate;
use App\Modules\Access\Infrastructure\AccessProjector;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Spatie\EventSourcing\Projectionist;

final class ReplayAccessCommand extends Command
{
    protected $signature = 'access:replay';

    protected $description = 'Rebuild Access projections transactionally from their event stream';

    public function handle(AccessCommands $commands, Projectionist $projectionist): int
    {
        DB::transaction(function () use ($commands, $projectionist) {
            $commands->lock();
            $projectionist->replay(collect([app(AccessProjector::class)]), aggregateUuid: AccessAggregate::UUID);
            DB::table('access_state')->where('id', 1)->increment('version');
        });
        $this->info('Access projections rebuilt.');

        return self::SUCCESS;
    }
}
