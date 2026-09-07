import { readFileSync, existsSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));

export function readEnv(relativePath) {
  const filename = path.join(root, relativePath);
  if (!existsSync(filename)) throw new Error(`Missing ${relativePath}. Run pnpm run setup first.`);
  return parseEnv(readFileSync(filename, 'utf8'));
}

export function developmentConfig(values) {
  const port = (key, fallback) => {
    const value = values[key] ?? fallback;
    if (!/^\d+$/.test(String(value)) || Number(value) < 1 || Number(value) > 65535) {
      throw new Error(`Invalid ${key}: expected a port from 1 to 65535`);
    }
    return Number(value);
  };
  const host = (key, fallback) => {
    const value = values[key] ?? fallback;
    if (!/^[a-zA-Z0-9.-]+$/.test(value)) throw new Error(`Invalid ${key}: expected an IPv4 address or hostname`);
    return value;
  };
  const frontendHost = host('DEV_FRONTEND_HOST', '127.0.0.1');
  const backendHost = host('DEV_BACKEND_HOST', '127.0.0.1');
  const frontendPort = port('DEV_FRONTEND_PORT', 9527);
  const backendPort = port('DEV_BACKEND_PORT', 8000);
  if (frontendPort === backendPort) throw new Error('Frontend and backend must use different ports');
  return {
    frontendHost,
    backendHost,
    frontendPort,
    backendPort,
    apiUrl: `http://${backendHost === '0.0.0.0' ? '127.0.0.1' : backendHost}:${backendPort}`,
    frontendUrl: `http://${frontendHost === '0.0.0.0' ? '127.0.0.1' : frontendHost}:${frontendPort}`
  };
}

export function backendEnvironment(mode = 'development') {
  return {
    ...process.env,
    APP_ENV: mode,
    APP_CONFIG_CACHE: path.join(root, `backend/bootstrap/cache/config.${mode}.php`),
    XDEBUG_MODE: 'off'
  };
}
