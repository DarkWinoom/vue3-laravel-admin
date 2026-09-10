import { spawn, spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  realpathSync,
  readFileSync,
  copyFileSync,
  cpSync,
  chmodSync,
  readdirSync,
  existsSync,
  rmSync,
  mkdirSync,
  writeFileSync
} from 'node:fs';
import { createServer } from 'node:http';
import { createServer as createProbe } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { root } from './env.mjs';

const platform = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'darwin' : 'linux';
const platformKey = platform + '-' + (process.arch === 'arm64' ? 'aarch64' : 'x86_64');
const temporaryRoot = realpathSync(os.tmpdir());
const temporary = mkdtempSync(path.join(temporaryRoot, 'vue3-update-'));
const installDirectory = path.join(temporary, 'installed');
const children = [];
const driver = 'http://127.0.0.1:4445';
let session;
let server;
let signature = '';
let payload = Buffer.alloc(0);
let responseMode = 'missing';
const downloads = [];
function run(args, env = process.env, quiet = false) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    env,
    stdio: quiet ? 'pipe' : 'inherit',
    windowsHide: true
  });
  if (result.status !== 0) throw new Error('Update fixture command failed: ' + args[0]);
}
async function wait(check, message, milliseconds = 60000) {
  const deadline = Date.now() + milliseconds;
  while (Date.now() < deadline) {
    try {
      const value = await check();
      if (value) return value;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(message);
}
async function command(method, suffix, body) {
  const response = await fetch(driver + suffix, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000)
  });
  const data = await response.json();
  if (!response.ok || data.value?.error) throw Error(JSON.stringify(data.value));
  return data.value;
}
const evaluate = script => command('POST', '/session/' + session + '/execute/sync', { script, args: [] });
const bodyText = () => evaluate('return document.body.innerText');
async function click(text, deferred = false) {
  await wait(
    () =>
      evaluate(
        'const e=[...document.querySelectorAll("button,.n-tabs-tab")].find(e=>e.textContent.trim()===' +
          JSON.stringify(text) +
          ' && e.getBoundingClientRect().width); if(!e || e.disabled)return false; ' +
          (deferred ? 'setTimeout(()=>e.click(),250);' : 'e.click();') +
          ' return true;'
      ),
    'Missing updater control: ' + text
  );
}
async function attach() {
  await wait(async () => (await fetch(driver + '/status')).ok, 'Update test driver unavailable');
  session = (
    await wait(
      () => command('POST', '/session', { capabilities: { alwaysMatch: { browserName: 'tauri' } } }),
      'Updater window did not start'
    )
  ).sessionId;
  await wait(() => evaluate('return Boolean(window.__TAURI_INTERNALS__)'), 'Tauri not ready');
}
async function showUpdates() {
  await wait(() => bodyText(), 'App did not render');
  await click('连接与更新');
  await click('版本与更新');
}
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? files(path.join(directory, e.name)) : [path.join(directory, e.name)]
  );
}
try {
  for (const port of [8022, 4445])
    await new Promise((resolve, reject) => {
      const probe = createProbe();
      probe.once('error', reject);
      probe.listen(port, '127.0.0.1', () => probe.close(resolve));
    });
  const key = path.join(temporary, 'ephemeral.key');
  run(['frontend/node_modules/@tauri-apps/cli/tauri.js', 'signer', 'generate', '--ci', '-w', key], process.env, true);
  const env = {
    ...process.env,
    TAURI_SIGNING_PRIVATE_KEY: key,
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: '',
    DESKTOP_UPDATER_PUBLIC_KEY: readFileSync(key + '.pub', 'utf8').trim(),
    DESKTOP_E2E_UPDATER_ENDPOINT: 'http://127.0.0.1:8022/latest.json',
    DESKTOP_E2E_INSTALL_DIRECTORY: installDirectory
  };
  const build = ['scripts/desktop.mjs', 'build', '--mode', 'testing', '--debug', '--features', 'desktop-e2e'];
  const bundleKind = platform === 'windows' ? 'nsis' : platform === 'darwin' ? 'app' : 'appimage';
  const bundleRoot = path.join(root, 'frontend/src-tauri/target/debug/bundle');
  const originalArgs = platform === 'windows' ? ['--no-bundle'] : ['--bundles', bundleKind];
  run([...build, ...originalArgs], { ...env, DESKTOP_E2E_VERSION: '0.1.0' });
  let original;
  if (platform === 'windows') {
    original = path.join(temporary, 'vue3-laravel-admin.exe');
    copyFileSync(path.join(root, 'frontend/src-tauri/target/debug/vue3-laravel-admin.exe'), original);
  } else if (platform === 'darwin') {
    const app = readdirSync(path.join(bundleRoot, 'macos')).find(p => p.endsWith('.app'));
    assert.ok(app);
    cpSync(path.join(bundleRoot, 'macos', app), path.join(installDirectory, app), { recursive: true });
    const executables = path.join(installDirectory, app, 'Contents/MacOS');
    original = path.join(executables, readdirSync(executables)[0]);
  } else {
    const image = files(path.join(bundleRoot, 'appimage')).find(p => p.endsWith('.AppImage') && p.includes('0.1.0'));
    assert.ok(image);
    original = path.join(temporary, 'admin-test.AppImage');
    copyFileSync(image, original);
    chmodSync(original, 0o755);
  }
  run([...build, '--release', '--bundles', bundleKind], { ...env, DESKTOP_E2E_VERSION: '0.1.1' });
  const updaterExtension = platform === 'windows' ? '.exe' : platform === 'darwin' ? '.app.tar.gz' : '.AppImage';
  const installer = files(
    path.join(bundleRoot, platform === 'windows' ? 'nsis' : platform === 'darwin' ? 'macos' : 'appimage')
  ).find(p => p.endsWith(updaterExtension) && (platform === 'darwin' || p.includes('0.1.1')));
  assert.ok(installer, 'Signed test installer missing');
  payload = readFileSync(installer);
  signature = readFileSync(installer + '.sig', 'utf8').trim();
  server = createServer((request, response) => {
    if (request.url === '/update.exe') downloads.push(responseMode);
    if (request.url === '/latest.json') {
      response.setHeader('Content-Type', 'application/json');
      response.end(
        JSON.stringify({
          version: '0.1.1',
          notes: 'Isolated updater acceptance fixture',
          platforms: { [platformKey]: { signature, url: 'http://127.0.0.1:8022/update.exe' } }
        })
      );
    } else if (request.url === '/update.exe' && responseMode !== 'missing') {
      const bytes = Buffer.from(payload);
      if (responseMode === 'tampered') bytes[Math.floor(bytes.length / 2)] ^= 1;
      response.setHeader('Content-Length', bytes.length);
      response.end(bytes);
    } else {
      response.statusCode = 503;
      response.end('Fixture download unavailable');
    }
  });
  await new Promise(resolve => server.listen(8022, '127.0.0.1', resolve));
  children.push(
    spawn(original, [], {
      env: { ...process.env, TAURI_WEBDRIVER_PORT: '4445', APPIMAGE_EXTRACT_AND_RUN: '1' },
      windowsHide: true,
      stdio: 'ignore'
    })
  );
  await attach();
  await showUpdates();
  await click('检查更新');
  await wait(async () => (await bodyText()).includes('新版本 0.1.1'), 'Signed update not discovered');
  await click('下载并安装');
  await wait(
    async () => downloads.includes('missing') && (await bodyText()).includes('下载、签名校验或安装失败'),
    'Download failure was not reported'
  );
  assert.ok(!existsSync(path.join(installDirectory, 'vue3-laravel-admin.exe')));
  responseMode = 'tampered';
  await click('下载并安装');
  await wait(
    async () =>
      downloads.includes('tampered') &&
      (await bodyText()).includes('下载、签名校验或安装失败') &&
      !(await bodyText()).includes('重启完成更新'),
    'Tampered update was not rejected'
  );
  assert.ok(!existsSync(path.join(installDirectory, 'vue3-laravel-admin.exe')));
  responseMode = 'valid';
  await click('下载并安装');
  if (platform === 'windows') {
    await wait(
      () => existsSync(path.join(installDirectory, 'vue3-laravel-admin.exe')),
      'Valid signed update did not install',
      120000
    );
  } else {
    await wait(
      async () => (await bodyText()).includes('更新已安装，请重启应用。'),
      'Valid signed update did not install',
      120000
    );
    await click('重启完成更新', true);
  }
  await wait(() => children[0].exitCode !== null, 'Previous app did not exit after installing');
  session = null;
  await attach();
  await showUpdates();
  await wait(
    async () => (await bodyText()).includes('当前版本：0.1.1'),
    'Updated app did not restart with new version'
  );
  console.log(
    platform + ' updater verified: download failure, tamper rejection, signed 0.1.0 to 0.1.1 install and restart.'
  );
} catch (error) {
  if (session)
    console.error(
      'Updater page error:',
      await evaluate('return document.documentElement.dataset.desktopUpdateError || null').catch(() => 'WebView exited')
    );
  console.error('Updater asset requests:', downloads);
  if (session)
    try {
      const png = await command('GET', '/session/' + session + '/screenshot');
      mkdirSync(path.join(root, 'test-results/native'), { recursive: true });
      writeFileSync(path.join(root, 'test-results/native/update-failure.png'), Buffer.from(png, 'base64'));
    } catch {}
  throw error;
} finally {
  if (session) {
    await evaluate("window.__TAURI_INTERNALS__.invoke('plugin:process|exit', {code:0}); return true;").catch(() => {});
    session = null;
  }
  for (const child of children)
    if (child.pid) {
      if (platform === 'windows') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      else child.kill('SIGTERM');
    }
  if (platform === 'windows') {
    const installed = path.join(installDirectory, 'vue3-laravel-admin.exe');
    const escaped = installed.replaceAll("'", "''");
    spawnSync(
      'powershell.exe',
      ['-NoProfile', '-Command', "Get-Process | Where-Object { $_.Path -eq '" + escaped + "' } | Stop-Process -Force"],
      { stdio: 'ignore', windowsHide: true }
    );
    const uninstaller = existsSync(installDirectory)
      ? files(installDirectory).find(p => /uninstall.*\.exe$/i.test(p))
      : null;
    if (uninstaller) spawnSync(uninstaller, ['/S'], { stdio: 'ignore', windowsHide: true });
  }
  if (server) await new Promise(resolve => server.close(resolve));
  await new Promise(resolve => setTimeout(resolve, 1500));
  if (path.dirname(temporary) !== temporaryRoot || !path.basename(temporary).startsWith('vue3-update-'))
    throw Error('Unexpected update fixture directory');
  rmSync(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
}
