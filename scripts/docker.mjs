import './setup.mjs';
import { spawnSync } from 'node:child_process';
import { root, frontendEnvironment } from './env.mjs';

const [action = 'up', mode = 'testing'] = process.argv.slice(2);
if (!['up', 'update', 'down'].includes(action) || !['testing', 'production'].includes(mode)) {
  throw new Error('Use docker.mjs up|update|down [testing|production]');
}
const commands =
  action === 'down'
    ? [['down']]
    : action === 'update'
      ? [
          ['build', '--pull'],
          ['up', '-d', '--wait', '--wait-timeout', '180']
        ]
      : [['up', '-d', '--build', '--wait', '--wait-timeout', '180']];
for (const args of commands) {
  const result = spawnSync('docker', ['compose', '--env-file', `.env.${mode}`, ...args], {
    cwd: root,
    env: { ...process.env, FRONTEND_ENV: frontendEnvironment(mode) },
    stdio: 'inherit'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
