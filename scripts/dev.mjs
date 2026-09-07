import concurrently from 'concurrently';
import { root, readEnv, developmentConfig, backendEnvironment } from './env.mjs';
import path from 'node:path';

try {
  const config = developmentConfig(readEnv('.env.development.local'));
  readEnv('backend/.env.development');
  readEnv('frontend/.env.development.local');
  const desktop = process.argv.includes('--desktop');
  const frontendEnv = {
    ...process.env,
    DEV_FRONTEND_HOST: config.frontendHost,
    DEV_FRONTEND_PORT: String(config.frontendPort),
    VITE_SERVICE_BASE_URL: config.apiUrl
  };
  const { result } = concurrently(
    [
      {
        name: 'api',
        command: `php artisan serve --env=development --host=${config.backendHost} --port=${config.backendPort} --tries=1`,
        cwd: path.join(root, 'backend'),
        env: { ...backendEnvironment(), APP_URL: config.apiUrl }
      },
      {
        name: desktop ? 'desktop' : 'web',
        command: desktop ? 'node ../scripts/desktop.mjs' : 'pnpm dev',
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
