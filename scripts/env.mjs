import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));

export function readEnv(mode) {
  return Object.assign(
    {},
    ...['.env', `.env.${mode}`].map(name => parseEnv(readFileSync(path.join(root, name), 'utf8')))
  );
}

export function developmentConfig(values) {
  const frontendPort = Number(values.DEV_FRONTEND_PORT || 9527);
  const backendPort = Number(values.DEV_BACKEND_PORT || 8000);
  if (
    [frontendPort, backendPort].some(port => !Number.isInteger(port) || port < 1 || port > 65535) ||
    frontendPort === backendPort
  ) {
    throw new Error('Use distinct frontend and backend ports between 1 and 65535');
  }
  return {
    frontendPort,
    backendPort,
    apiUrl: `http://127.0.0.1:${backendPort}`,
    frontendUrl: `http://127.0.0.1:${frontendPort}`
  };
}

export function backendEnvironment(mode) {
  return {
    ...process.env,
    ...readEnv(mode),
    APP_ENV: mode,
    APP_CONFIG_CACHE: path.join(root, `backend/bootstrap/cache/config.${mode}.php`),
    XDEBUG_MODE: 'off'
  };
}
