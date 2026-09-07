import { spawn } from 'node:child_process';
import path from 'node:path';
import { root, developmentConfig, readEnv } from './env.mjs';

const config = developmentConfig(readEnv('development'));
const child = spawn(
  process.execPath,
  [
    path.join(root, 'frontend/node_modules/@tauri-apps/cli/tauri.js'),
    'dev',
    '--config',
    JSON.stringify({ build: { devUrl: config.frontendUrl } })
  ],
  { cwd: path.join(root, 'frontend'), stdio: 'inherit', env: process.env }
);
child.on('error', error => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', code => {
  process.exitCode = code ?? 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
