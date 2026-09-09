import { spawn } from 'node:child_process';
import path from 'node:path';
import './setup.mjs';
import { root, readEnv } from './env.mjs';
import { desktopConfig, appSettings } from './desktop-config.mjs';

const args = process.argv.slice(2);
const action = args.shift() || 'dev';
if (!['dev', 'build'].includes(action)) throw new Error('Use desktop.mjs dev|build');
const modeAt = args.indexOf('--mode');
const mode = modeAt >= 0 ? args.splice(modeAt, 2)[1] : action === 'dev' ? 'development' : 'production';
const releaseAt = args.indexOf('--release');
const release = releaseAt >= 0;
if (release) args.splice(releaseAt, 1);
const apiAt = args.indexOf('--api');
const apiOverride = apiAt >= 0 ? args.splice(apiAt, 2)[1] : process.env.DESKTOP_API_URL;
const e2e = args.includes('desktop-e2e');
if (e2e && (mode !== 'testing' || !args.includes('--debug')))
  throw new Error('desktop-e2e requires testing mode and --debug');
const { config, env } = desktopConfig({
  mode,
  release,
  values: { ...readEnv(mode), ...(apiOverride ? { DESKTOP_API_URL: apiOverride } : {}) },
  signing: process.env,
  ...appSettings()
});
if (e2e)
  config.app.security.capabilities = [
    'default',
    { identifier: 'desktop-e2e', windows: ['main'], permissions: ['wdio-webdriver:default'] }
  ];
const child = spawn(
  process.execPath,
  [
    path.join(root, 'frontend/node_modules/@tauri-apps/cli/tauri.js'),
    action,
    '--config',
    JSON.stringify(config),
    ...args
  ],
  { cwd: path.join(root, 'frontend'), stdio: 'inherit', env: { ...process.env, ...env } }
);
child.on('error', error => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', code => {
  process.exitCode = code ?? 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
