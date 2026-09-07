import { test } from 'node:test';
import assert from 'node:assert/strict';
import { developmentConfig, backendEnvironment, readEnv, frontendEnvironment } from '../env.mjs';

test('development ports determine API and desktop URLs', () => {
  const config = developmentConfig({ DEV_FRONTEND_PORT: '9530', DEV_BACKEND_PORT: '8010' });
  assert.equal(config.apiUrl, 'http://127.0.0.1:8010');
  assert.equal(config.frontendUrl, 'http://127.0.0.1:9530');
});

test('rejects conflicting or invalid ports', () => {
  assert.throws(() => developmentConfig({ DEV_FRONTEND_PORT: '8000' }));
  assert.throws(() => developmentConfig({ DEV_BACKEND_PORT: '8000 & echo bad' }));
  assert.throws(() => developmentConfig({ DEV_BACKEND_PORT: '65536' }));
});

test('root environment separates public defaults from mode-specific database settings', () => {
  assert.equal(readEnv('development').VITE_BASE_URL, '/');
  assert.notEqual(readEnv('development').DB_DATABASE, readEnv('testing').DB_DATABASE);
});

test('Docker build receives public configuration without backend keys', () => {
  const buildEnv = frontendEnvironment('testing');
  assert.ok(buildEnv.includes('VITE_BASE_URL="/"'));
  assert.ok(!buildEnv.includes('APP_KEY='));
  assert.ok(!buildEnv.includes('JWT_SECRET='));
  assert.ok(!buildEnv.includes('DB_PASSWORD='));
});

test('testing and development configuration caches are isolated', () => {
  assert.notEqual(backendEnvironment('testing').APP_CONFIG_CACHE, backendEnvironment('development').APP_CONFIG_CACHE);
  assert.equal(backendEnvironment('testing').APP_ENV, 'testing');
});
