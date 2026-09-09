import './setup.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

if (!process.env.CI && !process.argv.includes('--local-fixture'))
  throw new Error('CI environment setup requires CI or --local-fixture');
const overrides = {
  APP_ENV: 'testing',
  APP_URL: 'http://127.0.0.1:8011',
  APP_DEBUG: 'false',
  APP_KEY: 'base64:' + randomBytes(32).toString('base64'),
  JWT_SECRET: randomBytes(48).toString('hex'),
  DB_CONNECTION: 'mysql',
  DB_HOST: '127.0.0.1',
  DB_PORT: process.env.CI_MYSQL_PORT || '3306',
  DB_DATABASE: 'admin_testing',
  DB_USERNAME: 'root',
  DB_PASSWORD: process.env.CI_MYSQL_PASSWORD || 'testing',
  DEV_FRONTEND_PORT: '9531',
  DEV_BACKEND_PORT: '8011',
  CACHE_STORE: 'array',
  API_DOCS_ENABLED: 'true'
};
const initial = readFileSync('.env.testing.example', 'utf8');
const kept = initial.split(/\r?\n/).filter(line => !Object.hasOwn(overrides, line.split('=')[0]));
writeFileSync(
  '.env.testing',
  kept.join('\n') +
    '\n' +
    Object.entries(overrides)
      .map(([k, v]) => k + '=' + JSON.stringify(v))
      .join('\n') +
    '\n'
);
console.log('Isolated CI test environment prepared.');
