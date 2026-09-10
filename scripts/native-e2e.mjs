import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import { createServer } from 'node:net';
import path from 'node:path';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { root, backendEnvironment } from './env.mjs';

const temporary = mkdtempSync(path.join(os.tmpdir(), 'vue3-native-'));
const database = path.join(temporary, 'app_testing');
writeFileSync(database, '');
const env = {
  ...backendEnvironment('testing'),
  DB_CONNECTION: 'sqlite',
  DB_DATABASE: database,
  DB_URL: '',
  APP_CONFIG_CACHE: path.join(temporary, 'config.php'),
  JWT_SECRET: randomBytes(48).toString('hex'),
  APP_KEY: 'base64:' + randomBytes(32).toString('base64'),
  APP_URL: 'http://127.0.0.1:8021',
  API_DOCS_ENABLED: 'true',
  LOG_CHANNEL: 'null'
};
const children = [];
let session;
const driver = 'http://127.0.0.1:4445';
async function command(method, suffix, body) {
  const response = await fetch(driver + suffix, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000)
  });
  const data = await response.json();
  if (!response.ok || data.value?.error) throw new Error(JSON.stringify(data.value));
  return data.value;
}
async function wait(check, message) {
  const end = Date.now() + 60000;
  while (Date.now() < end) {
    try {
      const value = await check();
      if (value) return value;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(message);
}
async function element(using, value) {
  const found = await command('POST', '/session/' + session + '/element', { using, value });
  const id = found['element-6066-11e4-a52e-4f735466cecf'];
  if (!(await command('GET', '/session/' + session + '/element/' + id + '/displayed')))
    throw new Error('Element is not visible');
  return id;
}
async function click(text) {
  const id = await wait(
    () => element('xpath', "//button[normalize-space(.)='" + text + "']"),
    'Missing button ' + text
  );
  await command('POST', '/session/' + session + '/element/' + id + '/click', {});
}
async function type(selector, text) {
  const id = await wait(() => element('css selector', selector), 'Missing input');
  await command('POST', '/session/' + session + '/element/' + id + '/clear', {});
  await command('POST', '/session/' + session + '/element/' + id + '/value', { text });
}
const script = code => command('POST', '/session/' + session + '/execute/sync', { script: code, args: [] });
try {
  for (const port of [8021, 4445])
    await new Promise((resolve, reject) => {
      const probe = createServer();
      probe.once('error', reject);
      probe.listen(port, '127.0.0.1', () => probe.close(resolve));
    });
  for (const args of [
    ['artisan', 'migrate', '--force'],
    ['artisan', 'db:seed', '--class=Tests\\Fixtures\\BrowserSeeder', '--force']
  ]) {
    const result = spawnSync('php', args, { cwd: path.join(root, 'backend'), env, stdio: 'inherit' });
    if (result.status !== 0) throw new Error('Native fixture initialization failed');
  }
  children.push(
    spawn('php', ['-S', '127.0.0.1:8021', '-t', 'public', 'public/index.php'], {
      cwd: path.join(root, 'backend'),
      env,
      stdio: 'ignore',
      windowsHide: true
    })
  );
  await wait(async () => (await fetch('http://127.0.0.1:8021/api/v1/health')).ok, 'API did not start');
  const binary =
    process.env.DESKTOP_EXECUTABLE ||
    path.join(
      root,
      'frontend/src-tauri/target/debug/vue3-laravel-admin' + (process.platform === 'win32' ? '.exe' : '')
    );
  children.push(
    spawn(binary, [], { env: { ...process.env, TAURI_WEBDRIVER_PORT: '4445' }, stdio: 'inherit', windowsHide: true })
  );
  await wait(async () => {
    const r = await fetch(driver + '/status');
    return r.ok;
  }, 'Native WebDriver did not start');
  const created = await wait(
    () => command('POST', '/session', { capabilities: { alwaysMatch: { browserName: 'tauri' } } }),
    'Native window did not start'
  );
  session = created.sessionId;
  assert.ok(session);
  await wait(() => script('return Boolean(window.__TAURI_INTERNALS__);'), 'Tauri WebView did not initialize');
  await wait(() => element('css selector', 'input[placeholder="请输入邮箱"]'), 'Login did not render');
  await click('连接与更新');
  await type('input[placeholder="https://admin.example.com"]', 'http://example.com');
  await click('保存连接');
  await wait(
    async () => (await script('return document.body.innerText;')).includes('请输入 HTTPS 服务地址'),
    'Insecure remote origin was accepted'
  );
  await type('input[placeholder="https://admin.example.com"]', 'http://127.0.0.1:8021');
  await click('保存连接');
  await type('input[placeholder="请输入邮箱"]', 'browser-admin@example.test');
  await type('input[placeholder="请输入密码"]', 'Browser-test-password!');
  await click('登录');
  await wait(
    async () => (await script('return document.body.innerText;')).includes('权限总数'),
    'Authenticated dashboard did not load'
  );
  async function clickXpath(value) {
    const id = await wait(() => element('xpath', value), 'Missing native control: ' + value);
    await command('POST', '/session/' + session + '/element/' + id + '/click', {});
  }
  await clickXpath("//*[normalize-space(text())='系统管理']");
  await clickXpath("//*[normalize-space(text())='用户管理']");
  await click('新增');
  await wait(
    async () => (await script('return document.body.innerText;')).includes('新增用户'),
    'Create drawer not ready'
  );
  await type('input[placeholder="请输入用户名"]', 'Native E2E');
  await type('input[placeholder="请输入邮箱"]', 'native-e2e@example.test');
  await type('input[placeholder="请输入至少 12 位密码"]', 'Native-test-password!');
  await click('确定');
  await wait(
    async () => (await script('return document.body.innerText;')).includes('native-e2e@example.test'),
    'Native create failed'
  );
  await clickXpath("//tr[contains(.,'native-e2e@example.test')]//button[normalize-space(.)='编辑']");
  await wait(
    async () => (await script('return document.body.innerText;')).includes('编辑用户'),
    'Edit drawer not ready'
  );
  await type('.n-drawer input[placeholder="请输入用户名"]', 'Native Updated');
  await click('确定');
  await wait(
    async () => (await script('return document.body.innerText;')).includes('Native Updated'),
    'Native update failed'
  );
  await clickXpath("//tr[contains(.,'native-e2e@example.test')]//button[normalize-space(.)='删除']");
  await click('确认');
  await wait(
    async () => !(await script('return document.body.innerText;')).includes('native-e2e@example.test'),
    'Native delete failed'
  );
  await clickXpath("//*[normalize-space(text())='操作审计']");
  await click('详情');
  await wait(
    async () => (await script('return document.body.innerText;')).includes('审计详情'),
    'Native audit detail failed'
  );
  await clickXpath("//button[@aria-label='close']");
  await clickXpath("//*[normalize-space(text())='API 文档']");
  await wait(
    async () => await script("return Boolean(document.querySelector('.swagger-ui'))"),
    'Native Swagger failed'
  );
  await script(
    "document.querySelectorAll('button').forEach(b=>{if(b.textContent.trim()==='Browser Admin')b.click()});"
  );
  await clickXpath("//*[normalize-space(text())='个人中心']");
  await wait(
    async () => (await script('return document.body.innerText;')).includes('维护账户信息与显示名称'),
    'Native profile unavailable'
  );
  await command('POST', '/session/' + session + '/window/rect', { width: 360, height: 640 });
  await wait(
    () =>
      script(
        "const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='保存修改');if(!b)return false;const r=b.getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight && r.right<=innerWidth"
      ),
    'Profile save action is inaccessible at minimum width'
  );
  await click('保存修改');
  await wait(
    async () => (await script('return document.body.innerText;')).includes('个人资料已保存'),
    'Native profile save failed'
  );
  await command('POST', '/session/' + session + '/window/rect', { width: 1366, height: 768 });
  await script(
    "document.querySelectorAll('button').forEach(b=>{if(b.textContent.trim()==='Browser Admin')b.click()});"
  );
  await wait(
    async () => (await script('return document.body.innerText;')).includes('退出登录'),
    'Account menu unavailable'
  );
  const logout = await element('xpath', "//*[normalize-space(text())='退出登录']");
  await command('POST', '/session/' + session + '/element/' + logout + '/click', {});
  await click('确认');
  await wait(() => element('css selector', 'input[placeholder="请输入邮箱"]'), 'Logout did not return to login');
  await type('input[placeholder="请输入邮箱"]', 'browser-viewer@example.test');
  await type('input[placeholder="请输入密码"]', 'Browser-test-password!');
  await click('登录');
  await wait(
    async () => (await script('return document.body.innerText;')).includes('Browser Viewer'),
    'Viewer login failed'
  );
  const body = await script('return document.body.innerText;');
  assert.ok(body.includes('用户总数'));
  assert.ok(!body.includes('权限总数'));
  const sensitive = await script('return Object.keys(localStorage).filter(k=>/(?:token|refreshToken)$/i.test(k));');
  assert.deepEqual(sensitive, []);
  console.log(
    'Native login, authorization, account switching and memory-only token checks passed on ' + process.platform + '.'
  );
} catch (error) {
  if (session) {
    try {
      const png = await command('GET', '/session/' + session + '/screenshot');
      mkdirSync(path.join(root, 'test-results/native'), { recursive: true });
      writeFileSync(path.join(root, 'test-results/native/failure.png'), Buffer.from(png, 'base64'));
    } catch {}
  }
  throw error;
} finally {
  if (session) await command('DELETE', '/session/' + session).catch(() => {});
  for (const child of children.reverse()) {
    if (child.pid && process.platform === 'win32')
      spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill();
  }
  await new Promise(resolve => setTimeout(resolve, 500));
  if (
    path.dirname(path.resolve(temporary)) !== path.resolve(os.tmpdir()) ||
    !path.basename(temporary).startsWith('vue3-native-')
  )
    throw new Error('Unexpected temporary directory');
  rmSync(temporary, { recursive: true, force: true, maxRetries: 3 });
}
