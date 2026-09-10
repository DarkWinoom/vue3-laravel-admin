import { readdirSync, existsSync, copyFileSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { appSettings } from './desktop-config.mjs';
const { version } = appSettings();
const platform = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'darwin' : 'linux';
const arch = process.arch === 'arm64' ? 'aarch64' : 'x86_64';
const key = platform + '-' + arch;
const destination = '.release-artifacts';
mkdirSync(destination, { recursive: true });
function files(dir) {
  return existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap(e =>
        e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]
      )
    : [];
}
const source = files('frontend/src-tauri/target/release/bundle').filter(p =>
  /\.(exe|msi|dmg|deb|AppImage|app\.tar\.gz)(\.sig)?$/.test(p)
);
if (!source.length) throw new Error('No desktop packages were produced');
if (process.argv.includes('--signed') && platform === 'linux') {
  for (const file of source.filter(p => p.endsWith('.deb'))) {
    if (!existsSync(file + '.sig')) {
      const signed = spawnSync(
        process.execPath,
        ['frontend/node_modules/@tauri-apps/cli/tauri.js', 'signer', 'sign', file],
        { stdio: 'pipe', env: process.env }
      );
      if (signed.status !== 0) throw new Error('Debian update signing failed');
      source.push(file + '.sig');
    }
  }
}
const assets = [];
for (const file of source) {
  const name = key + '-' + path.basename(file).replaceAll(' ', '-');
  copyFileSync(file, path.join(destination, name));
  assets.push(name);
}
let update;
const updates = {};
for (const name of assets.filter(n => n.endsWith('.sig'))) {
  const binary = name.slice(0, -4);
  if (platform === 'linux' && binary.endsWith('.deb') && assets.includes(binary))
    updates[key + '-deb'] = { file: binary, signature: readFileSync(path.join(destination, name), 'utf8').trim() };
  if (
    assets.includes(binary) &&
    ((platform === 'windows' && binary.endsWith('.exe')) ||
      (platform === 'darwin' && binary.endsWith('.tar.gz')) ||
      (platform === 'linux' && binary.endsWith('.AppImage')))
  ) {
    update = { file: binary, signature: readFileSync(path.join(destination, name), 'utf8').trim() };
    if (platform === 'linux') updates[key + '-appimage'] = update;
  }
}
if (process.argv.includes('--signed') && !update) throw new Error('Missing signed updater artifact for ' + key);
writeFileSync(
  path.join(destination, 'build-' + key + '.json'),
  JSON.stringify({ version, platform: key, assets, update, updates }, null, 2) + '\n'
);
writeFileSync(
  path.join(destination, 'checksums-' + key + '.txt'),
  assets
    .map(
      name =>
        createHash('sha256')
          .update(readFileSync(path.join(destination, name)))
          .digest('hex') +
        '  ' +
        name
    )
    .join('\n') + '\n'
);
copyFileSync('LICENSE', path.join(destination, 'LICENSE.txt'));
copyFileSync('frontend/LICENSE', path.join(destination, 'SOYBEAN-LICENSE.txt'));
const metadata = spawnSync('cargo', ['metadata', '--locked', '--format-version', '1'], {
  cwd: 'frontend/src-tauri',
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024
});
if (metadata.status !== 0) throw new Error('Dependency metadata export failed');
const crates = JSON.parse(metadata.stdout).packages.map(p => ({
  name: p.name,
  version: p.version,
  license: p.license
}));
const frontend = JSON.parse(readFileSync('frontend/package.json', 'utf8'));
const dependencies = Object.keys(frontend.dependencies).map(name => {
  const p = JSON.parse(readFileSync(path.join('frontend/node_modules', name, 'package.json'), 'utf8'));
  return { name, version: p.version, license: p.license };
});
writeFileSync(
  path.join(destination, 'dependencies-' + key + '.json'),
  JSON.stringify({ frontend: dependencies, rust: crates }, null, 2) + '\n'
);
console.log('Collected ' + assets.length + ' packages/signatures for ' + key);
