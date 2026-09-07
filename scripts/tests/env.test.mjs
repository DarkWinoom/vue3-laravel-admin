import { test } from 'node:test';
import assert from 'node:assert/strict';
import { developmentConfig, backendEnvironment } from '../env.mjs';

test('development ports determine API and desktop URLs', () => {
  const config = developmentConfig({ DEV_FRONTEND_PORT: '9530', DEV_BACKEND_PORT: '8010' });
  assert.equal(config.apiUrl, 'http://127.0.0.1:8010');
  assert.equal(config.frontendUrl, 'http://127.0.0.1:9530');
});

test('rejects conflicting ports and shell metacharacters', () => {
  assert.throws(() => developmentConfig({ DEV_FRONTEND_PORT: '8000' }));
  assert.throws(() => developmentConfig({ DEV_BACKEND_HOST: 'localhost & echo bad' }));
  assert.throws(() => developmentConfig({ DEV_BACKEND_PORT: '65536' }));
});

test('testing and development configuration caches are isolated', () => {
  assert.notEqual(backendEnvironment('testing').APP_CONFIG_CACHE, backendEnvironment('development').APP_CONFIG_CACHE);
  assert.equal(backendEnvironment('testing').APP_ENV, 'testing');
});
