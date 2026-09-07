import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { root } from './env.mjs';

const templates = [
  ['.env.development.example', '.env.development.local'],
  ['frontend/.env.development.example', 'frontend/.env.development.local'],
  ['backend/.env.development.example', 'backend/.env.development']
];
for (const [source, target] of templates) {
  const filename = path.join(root, target);
  if (existsSync(filename)) continue;
  copyFileSync(path.join(root, source), filename);
  if (target.startsWith('backend/')) {
    const content = readFileSync(filename, 'utf8')
      .replace(/^APP_KEY=\r?$/m, `APP_KEY=base64:${randomBytes(32).toString('base64')}`)
      .replace(/^JWT_SECRET=\r?$/m, `JWT_SECRET=${randomBytes(64).toString('hex')}`);
    writeFileSync(filename, content);
  }
  console.log(`Created ${target}`);
}
for (const [command, args, directory] of [
  ['pnpm', ['install', '--frozen-lockfile'], 'frontend'],
  ['composer', ['install', '--no-interaction'], 'backend']
]) {
  const result = spawnSync(command, args, {
    cwd: path.join(root, directory),
    env: { ...process.env, XDEBUG_MODE: 'off' },
    shell: process.platform === 'win32',
    stdio: 'inherit'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('Configure backend/.env.development, then run pnpm db:migrate and pnpm dev.');
