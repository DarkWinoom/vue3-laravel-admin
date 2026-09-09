import concurrently from 'concurrently';
import { root, readEnv, developmentConfig, backendEnvironment } from './env.mjs';
import path from 'node:path';

try {
  const mode = process.argv.includes('--testing') ? 'testing' : 'development';
  const values = readEnv(mode);
  if (mode === 'testing' && (values.DB_CONNECTION !== 'mysql' || !values.DB_DATABASE.endsWith('_testing'))) {
    throw new Error('Testing development requires a dedicated MySQL database ending in _testing');
  }
  const config = developmentConfig(
    mode === 'testing' ? { DEV_FRONTEND_PORT: '9531', DEV_BACKEND_PORT: '8011', ...values } : values
  );
  const desktop = process.argv.includes('--desktop');
  const frontendEnv = {
    ...process.env,
    DEV_FRONTEND_PORT: String(config.frontendPort),
    VITE_SERVICE_BASE_URL: config.apiUrl,
    VITE_HTTP_PROXY: 'Y'
  };
  const { result } = concurrently(
    [
      {
        name: 'api',
        command: `php artisan serve --env=${mode} --host=127.0.0.1 --port=${config.backendPort} --tries=1`,
        cwd: path.join(root, 'backend'),
        env: { ...backendEnvironment(mode), APP_URL: config.apiUrl, DEV_FRONTEND_PORT: String(config.frontendPort) }
      },
      {
        name: desktop ? 'desktop' : 'web',
        command: desktop
          ? 'node ../scripts/desktop.mjs dev --mode ' + mode
          : mode === 'testing'
            ? 'node node_modules/vite/bin/vite.js --mode testing'
            : 'pnpm dev',
        cwd: path.join(root, 'frontend'),
        env: frontendEnv
      }
    ],
    { killOthersOn: ['failure', 'success'], prefixColors: ['blue', 'green'], successCondition: 'all' }
  );
  console.log(`Web: ${config.frontendUrl} | API: ${config.apiUrl}/up`);
  await result;
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Development services stopped');
  process.exitCode = 1;
}
