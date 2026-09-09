import { readFileSync } from 'node:fs';
import { developmentConfig } from './env.mjs';

export function validateApiUrl(value, allowLocal = false) {
  const url = new URL(value);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/' ||
    !(url.protocol === 'https:' || (allowLocal && local && url.protocol === 'http:'))
  ) {
    throw new Error('API 地址必须是无路径、凭据或参数的 HTTPS origin；开发/测试允许本机 HTTP。');
  }
  return url.origin;
}

export function desktopConfig({ mode = 'production', release = false, values = {}, signing = {}, settings, version }) {
  if (!['development', 'testing', 'production'].includes(mode)) throw new Error('Invalid desktop mode');
  if (!/^\d+\.\d+\.\d+([+-][0-9A-Za-z.-]+)?$/.test(version)) throw new Error('Invalid app version');
  const local = mode !== 'production';
  const ports = developmentConfig(
    mode === 'testing' ? { DEV_FRONTEND_PORT: '9531', DEV_BACKEND_PORT: '8011', ...values } : values
  );
  const api = values.DESKTOP_API_URL ? validateApiUrl(values.DESKTOP_API_URL, local) : local ? ports.apiUrl : '';
  const pubkey = signing.DESKTOP_UPDATER_PUBLIC_KEY?.trim() || '';
  if (release && (!signing.TAURI_SIGNING_PRIVATE_KEY || !pubkey))
    throw new Error('签名发布需要 TAURI_SIGNING_PRIVATE_KEY 和 DESKTOP_UPDATER_PUBLIC_KEY');
  const endpoint = new URL(settings.updateEndpoint);
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password)
    throw new Error('Updater endpoint must use HTTPS');
  const csp = {
    'default-src': "'self'",
    'script-src': "'self'",
    'style-src': "'self' 'unsafe-inline'",
    'img-src': "'self' data: blob:",
    'font-src': "'self' data:",
    'connect-src':
      "'self' ipc: http://ipc.localhost https://ipc.localhost https:" +
      (local
        ? ' http://localhost:* http://127.0.0.1:* http://[::1]:* ws://localhost:* ws://127.0.0.1:* ws://[::1]:*'
        : ''),
    'object-src': "'none'",
    'frame-src': "'none'",
    'base-uri': "'self'"
  };
  return {
    config: {
      productName: settings.productName,
      identifier: settings.identifier,
      version,
      build: {
        devUrl: ports.frontendUrl,
        beforeDevCommand: 'node node_modules/vite/bin/vite.js --mode ' + mode,
        beforeBuildCommand: 'node node_modules/vite/bin/vite.js build --mode ' + mode
      },
      app: {
        windows: [
          {
            label: 'main',
            title: settings.productName,
            width: 1366,
            height: 768,
            minWidth: 360,
            minHeight: 560,
            resizable: true,
            useHttpsScheme: !local
          }
        ],
        security: { csp, devCsp: csp }
      },
      bundle: { createUpdaterArtifacts: release },
      ...(pubkey
        ? { plugins: { updater: { pubkey, endpoints: [endpoint.href], windows: { installMode: 'passive' } } } }
        : {})
    },
    env: {
      DEV_FRONTEND_PORT: String(ports.frontendPort),
      VITE_DESKTOP_BUILD: 'Y',
      VITE_DESKTOP_API_URL: api,
      VITE_DESKTOP_ALLOW_LOCAL_HTTP: local ? 'Y' : 'N',
      VITE_DESKTOP_UPDATER_ENABLED: pubkey ? 'Y' : 'N',
      VITE_APP_TITLE: settings.productName,
      VITE_APP_VERSION: version,
      VITE_ROUTER_HISTORY_MODE: 'hash',
      VITE_HTTP_PROXY: 'N',
      VITE_BASE_URL: './',
      DESKTOP_UPDATER_ENABLED: pubkey ? 'Y' : 'N'
    }
  };
}

export function appSettings() {
  return {
    settings: JSON.parse(readFileSync(new URL('../desktop.json', import.meta.url), 'utf8')),
    version: JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version
  };
}
