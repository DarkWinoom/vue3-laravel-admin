import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { root, backendEnvironment, readEnv } from './env.mjs';

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
if (action === 'migrate') readEnv('backend/.env.development');
let databaseEnv = {};
if (action === 'test:mysql') {
  const values = readEnv('backend/.env.testing');
  databaseEnv = Object.fromEntries(
    ['DB_CONNECTION', 'DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD'].map(key => [
      key,
      values[key] ?? ''
    ])
  );
  if (databaseEnv.DB_CONNECTION !== 'mysql' || !databaseEnv.DB_DATABASE.endsWith('_testing')) {
    throw new Error('MySQL tests require a dedicated database ending in _testing');
  }
  databaseEnv.DB_URL = '';
}
for (const args of commands[action]) {
  const result = spawnSync('php', args, {
    cwd: path.join(root, 'backend'),
    env: { ...backendEnvironment(action === 'migrate' ? 'development' : 'testing'), ...databaseEnv },
    stdio: 'inherit'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
