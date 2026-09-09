import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:9531', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    command: 'node scripts/dev.mjs --testing',
    cwd: '..',
    url: 'http://127.0.0.1:9531',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
