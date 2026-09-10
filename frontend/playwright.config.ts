import { defineConfig } from '@playwright/test';
import { developmentConfig, readEnv } from '../scripts/env.mjs';

const { frontendUrl } = developmentConfig({
  DEV_FRONTEND_PORT: '9531',
  DEV_BACKEND_PORT: '8011',
  ...readEnv('testing')
});

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: frontendUrl, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    command: 'node scripts/dev.mjs --testing',
    cwd: '..',
    url: frontendUrl,
    reuseExistingServer: false,
    timeout: 120000
  }
});
