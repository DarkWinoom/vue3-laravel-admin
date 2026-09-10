import { randomUUID } from 'node:crypto';
import { format, resolveConfig } from 'prettier';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { root } from './env.mjs';
import { repositoryContext } from './repository.mjs';

export function initializeSettings(previous, context, { name, identifier } = {}) {
  const binding = previous.repository;
  const same =
    binding &&
    (binding.server || 'https://github.com') === context.server &&
    (binding.id && context.id
      ? String(binding.id) === String(context.id)
      : binding.name.toLowerCase() === context.repository.toLowerCase());
  if (same && identifier && identifier !== previous.identifier)
    throw new Error('Existing application identifier cannot be changed by initialization');
  const settings = same
    ? { ...previous }
    : {
        productName: context.repository.split('/')[1],
        identifier: identifier || 'com.github.app' + (context.id || randomUUID().replaceAll('-', '')),
        releaseMode: 'basic',
        releaseEnvironment: '',
        updaterPublicKey: '',
        updateEndpoint: ''
      };
  if (!same) settings.binaryName = 'app-' + settings.identifier.split('.').at(-1);
  if (name) settings.productName = name;
  if (!settings.productName.trim() || /[\x00-\x1f/\\:*?"<>|]/.test(settings.productName))
    throw new Error('Invalid product name');
  if (!/^[A-Za-z][\w-]*(\.[A-Za-z][\w-]*)+$/.test(settings.identifier))
    throw new Error('Invalid application identifier');
  settings.repository = {
    name: context.repository,
    id: context.id || (same ? binding.id : '') || '',
    server: context.server
  };
  return settings;
}

export async function synchronizeNative(settings, version, cwd = root) {
  const filename = path.join(cwd, 'frontend/src-tauri/tauri.conf.json');
  const tauri = JSON.parse(readFileSync(filename, 'utf8'));
  Object.assign(tauri, { productName: settings.productName, identifier: settings.identifier, version });
  tauri.app.windows[0].title = settings.productName;
  if (settings.binaryName) tauri.mainBinaryName = settings.binaryName;
  const cargoPath = path.join(cwd, 'frontend/src-tauri/Cargo.toml');
  const cargo = readFileSync(cargoPath, 'utf8');
  const name = cargo.match(/^name\s*=\s*"([^"]+)"/m)?.[1];
  const old = cargo.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
  const lockPath = path.join(cwd, 'frontend/src-tauri/Cargo.lock');
  const lock = readFileSync(lockPath, 'utf8').replaceAll('\r\n', '\n');
  const entry = '[[package]]\nname = "' + name + '"\nversion = "' + old + '"';
  if (!name || !old || !lock.includes(entry)) throw new Error('Cargo lock app entry missing');
  writeFileSync(filename, await format(JSON.stringify(tauri), { ...(await resolveConfig(filename)), parser: 'json' }));
  writeFileSync(cargoPath, cargo.replace(/^version\s*=\s*"[^"]+"/m, 'version = "' + version + '"'));
  writeFileSync(lockPath, lock.replace(entry, entry.replace('version = "' + old + '"', 'version = "' + version + '"')));
}

async function main() {
  const { values } = parseArgs({
    options: {
      name: { type: 'string' },
      identifier: { type: 'string' },
      repository: { type: 'string' },
      updater: { type: 'boolean' },
      'upload-secrets': { type: 'boolean' },
      offline: { type: 'boolean' },
      help: { type: 'boolean' }
    }
  });
  if (values.help) {
    console.log(
      'pnpm project:init [--name "My Admin"] [--repository owner/repo] [--identifier com.example.admin] [--updater] [--upload-secrets]\nDefaults to the GitHub origin. Repeated initialization preserves identity and keys. --upload-secrets explicitly writes the updater key to that repository using authenticated gh.'
    );
    return;
  }
  const context = repositoryContext({
    env: { ...process.env, ...(values.repository ? { PROJECT_REPOSITORY: values.repository } : {}) }
  });
  const lookup = values.offline
    ? { status: 1 }
    : spawnSync('gh', ['api', '--hostname', new URL(context.server).hostname, 'repos/' + context.repository], {
        encoding: 'utf8',
        windowsHide: true
      });
  if (lookup.status === 0) context.id = String(JSON.parse(lookup.stdout).id);
  const file = path.join(root, 'desktop.json');
  const previous = JSON.parse(readFileSync(file, 'utf8'));
  const settings = initializeSettings(previous, context, values);
  const key = path.join(root, '.release-keys', settings.identifier + '.key');
  if (values.updater || values['upload-secrets']) {
    if (!existsSync(key)) {
      if (settings.releaseMode === 'updater' || settings.updaterPublicKey)
        throw new Error(
          'This app already uses updater signing. Restore the existing key backup; initialization will not rotate it.'
        );
      mkdirSync(path.dirname(key), { recursive: true });
      const generated = spawnSync(
        process.execPath,
        ['frontend/node_modules/@tauri-apps/cli/tauri.js', 'signer', 'generate', '--ci', '-w', key],
        { cwd: root, stdio: 'pipe', windowsHide: true }
      );
      if (generated.status !== 0)
        throw new Error(
          'Key generation failed. Install frontend dependencies first; existing files were not overwritten.'
        );
    }
    const publicKey = readFileSync(key + '.pub', 'utf8').trim();
    if (settings.updaterPublicKey && settings.updaterPublicKey !== publicKey)
      throw new Error('Backup public key differs from configured key');
    settings.releaseMode = 'updater';
    settings.updaterPublicKey = publicKey;
    // Persist before uploading so retries preserve the same application and backup.
    await synchronizeNative(settings, JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version);
    writeFileSync(file, JSON.stringify(settings, null, 2) + '\n');
    if (values['upload-secrets']) {
      for (const [secret, value] of [
        ['TAURI_SIGNING_PRIVATE_KEY', readFileSync(key, 'utf8')],
        ['TAURI_SIGNING_PRIVATE_KEY_PASSWORD', '']
      ]) {
        const result = spawnSync(
          'gh',
          [
            'secret',
            'set',
            secret,
            '--repo',
            context.server + '/' + context.repository,
            ...(settings.releaseEnvironment ? ['--env', settings.releaseEnvironment] : [])
          ],
          { input: value, stdio: ['pipe', 'ignore', 'ignore'], windowsHide: true }
        );
        if (result.status !== 0)
          throw new Error(
            'Secret upload failed. Backup and config retained; authenticate gh and retry, or configure Secrets manually.'
          );
      }
    }
    console.log('Updater key backup: ' + key + ' (keep a secure external backup; never commit this directory).');
  }
  const version = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  await synchronizeNative(settings, version);
  writeFileSync(file, JSON.stringify(settings, null, 2) + '\n');
  console.log(
    'Initialized ' +
      settings.productName +
      ' for ' +
      context.repository +
      ' (' +
      settings.releaseMode +
      '). Commit desktop.json and native metadata before tagging a release.'
  );
  if (settings.releaseMode === 'updater' && !values['upload-secrets'])
    console.log(
      'Automatic updates require the existing signing key in Actions Secrets. Initialization does not upload it automatically.'
    );
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
