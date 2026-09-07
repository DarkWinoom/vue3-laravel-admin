import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { root, backendEnvironment } from './env.mjs';

const action = process.argv[2];
const commands = {
  check: [
    ['vendor/bin/pint', '--test'],
    ['vendor/bin/phpstan', 'analyse', '--no-progress']
  ],
  test: [['vendor/bin/phpunit']],
  'test:mysql': [['vendor/bin/phpunit']],
  migrate: [['artisan', 'migrate', '--env=development']]
};
if (!commands[action]) throw new Error(`Unknown backend action: ${action}`);
const env = backendEnvironment(action === 'migrate' ? 'development' : 'testing');
if (action === 'test') Object.assign(env, { DB_CONNECTION: 'sqlite', DB_DATABASE: ':memory:', DB_URL: '' });
if (action === 'test:mysql' && (env.DB_CONNECTION !== 'mysql' || !env.DB_DATABASE.endsWith('_testing'))) {
  throw new Error('MySQL tests require a dedicated database ending in _testing');
}
for (const args of commands[action]) {
  const result = spawnSync('php', args, { cwd: path.join(root, 'backend'), env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
