import { appSettings } from './desktop-config.mjs';
import { currentPackages, requireSinglePackage } from './package-files.mjs';
import { nativeMetadata } from './native-metadata.mjs';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, mkdtempSync, realpathSync, readdirSync, rmSync, cpSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { root } from './env.mjs';

const native = nativeMetadata();
const { settings, version } = appSettings();
const packageFiles = directory => currentPackages(files(directory), { ...settings, version });
const temporaryRoot = realpathSync(os.tmpdir());
const temporary = mkdtempSync(path.join(temporaryRoot, 'vue3-package-'));
let app;
let mounted = false;
let linuxPackage;
function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', windowsHide: true });
  if (result.status !== 0) throw Error('Package command failed: ' + command);
}
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? files(path.join(directory, e.name)) : [path.join(directory, e.name)]
  );
}
const bundle = path.join(native.target, 'release/bundle');
const mount = path.join(temporary, 'mounted');
const install = path.join(temporary, 'installed');
try {
  let binary;
  if (process.platform === 'win32') {
    const installer = requireSinglePackage(packageFiles(path.join(bundle, 'nsis')), '.exe');
    assert.ok(installer);
    run(installer, ['/S', '/D=' + install]);
    binary = path.join(install, native.binary + '.exe');
  } else if (process.platform === 'darwin') {
    const dmg = requireSinglePackage(packageFiles(path.join(bundle, 'dmg')), '.dmg');
    assert.ok(dmg);
    mkdirSync(mount);
    run('hdiutil', ['attach', dmg, '-nobrowse', '-readonly', '-mountpoint', mount]);
    mounted = true;
    const name = readdirSync(mount).find(n => n.endsWith('.app'));
    assert.ok(name);
    cpSync(path.join(mount, name), path.join(install, name), { recursive: true });
    run('hdiutil', ['detach', mount]);
    mounted = false;
    const executable = path.join(install, name, 'Contents/MacOS');
    binary = path.join(executable, readdirSync(executable)[0]);
  } else {
    const deb = requireSinglePackage(packageFiles(path.join(bundle, 'deb')), '.deb');
    assert.ok(deb);
    linuxPackage = spawnSync('dpkg-deb', ['-f', deb, 'Package'], { encoding: 'utf8' }).stdout.trim();
    assert.match(linuxPackage, /^[a-z0-9][a-z0-9+.-]+$/);
    run('sudo', ['dpkg', '-i', deb]);
    binary = '/usr/bin/' + native.binary;
  }
  assert.ok(existsSync(binary), 'Installed binary missing');
  const installedFiles = linuxPackage
    ? spawnSync('dpkg', ['-L', linuxPackage], { encoding: 'utf8' }).stdout.trim().split('\n')
    : files(install);
  for (const [name, source] of [
    ['LICENSE.txt', 'LICENSE'],
    ['SOYBEAN-LICENSE.txt', 'frontend/LICENSE']
  ]) {
    const notice = installedFiles.find(file => path.basename(file) === name);
    assert.ok(notice, 'Missing packaged license: ' + name);
    assert.equal(
      readFileSync(notice, 'utf8').replaceAll('\r\n', '\n'),
      readFileSync(path.join(root, source), 'utf8').replaceAll('\r\n', '\n'),
      'Packaged license content differs: ' + name
    );
  }
  app = spawn(binary, [], { stdio: 'inherit', windowsHide: true });
  let startError;
  app.on('error', error => {
    startError = error;
  });
  await new Promise(resolve => setTimeout(resolve, 6000));
  assert.equal(startError, undefined);
  assert.equal(app.exitCode, null, 'Installed app exited unexpectedly');
  console.log('Production package installed and launched on ' + process.platform);
} finally {
  if (app?.pid) {
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(app.pid), '/T', '/F'], { stdio: 'ignore' });
    else app.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (mounted) run('hdiutil', ['detach', mount]);
  if (process.platform === 'win32' && existsSync(install)) {
    const uninstaller = files(install).find(p => /uninstall.*\.exe$/i.test(p));
    if (uninstaller) run(uninstaller, ['/S']);
  }
  if (linuxPackage) run('sudo', ['dpkg', '-r', linuxPackage]);
  await new Promise(resolve => setTimeout(resolve, 1500));
  if (path.dirname(temporary) !== temporaryRoot || !path.basename(temporary).startsWith('vue3-package-'))
    throw Error('Unexpected package fixture directory');
  rmSync(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
}
console.log('Package fixture uninstalled and cleaned.');
