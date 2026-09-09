import assert from 'node:assert/strict';
import test from 'node:test';
import { desktopConfig, validateApiUrl } from '../desktop-config.mjs';
const settings = {
  productName: 'Vue3 Laravel Admin',
  identifier: 'com.github.darkwinoom.vue3laraveladmin',
  updateEndpoint: 'https://github.com/example/project/releases/latest/download/latest.json'
};
test('production desktop starts without a baked-in test API and has an explicit CSP', () => {
  const { config, env } = desktopConfig({ settings, version: '0.1.0' });
  assert.equal(env.VITE_DESKTOP_API_URL, '');
  assert.equal(env.VITE_HTTP_PROXY, 'N');
  assert.equal(env.VITE_ROUTER_HISTORY_MODE, 'hash');
  assert.equal(config.app.security.csp['frame-src'], "'none'");
  assert.ok(!config.app.security.csp['connect-src'].includes('http://127.0.0.1'));
});
test('signing release fails before building when keys are absent', () => {
  assert.throws(() => desktopConfig({ settings, version: '0.1.0', release: true }), /TAURI_SIGNING_PRIVATE_KEY/);
});
test('API origins reject credentials, paths, queries and non-local HTTP', () => {
  for (const url of [
    'http://example.com',
    'https://user:pass@example.com',
    'https://example.com/api',
    'https://example.com?q=x',
    'file:///tmp/x'
  ])
    assert.throws(() => validateApiUrl(url));
  assert.equal(validateApiUrl('https://example.com/'), 'https://example.com');
  assert.equal(validateApiUrl('http://127.0.0.1:8021', true), 'http://127.0.0.1:8021');
});
test('testing desktop points to a local API without enabling unsigned updates', () => {
  const { env, config } = desktopConfig({ settings, version: '0.1.0', mode: 'testing' });
  assert.equal(env.VITE_DESKTOP_API_URL, 'http://127.0.0.1:8011');
  assert.equal(env.VITE_DESKTOP_UPDATER_ENABLED, 'N');
  assert.equal(config.bundle.createUpdaterArtifacts, false);
});
