import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { repositoryContext, resolveProject } from '../repository.mjs';
import { initializeSettings } from '../project-init.mjs';
import { desktopConfig } from '../desktop-config.mjs';
import { root } from '../env.mjs';

const original = {
  productName: 'Original',
  identifier: 'com.example.original',
  binaryName: 'original',
  repository: { name: 'alice/base', id: '101', server: 'https://github.com' },
  releaseMode: 'updater',
  updaterPublicKey: 'original-public-key',
  updateEndpoint: 'https://updates.example.com/latest.json',
  releaseEnvironment: 'protected'
};
const context = (repository, id = '') => ({ repository, id, server: 'https://github.com' });

test('repository detection supports Actions and local HTTPS / SSH push remotes', () => {
  for (const remote of [
    'https://github.com/bob/shop.git',
    'git@github.com:bob/shop.git',
    'ssh://git@github.com/bob/shop.git'
  ])
    assert.equal(repositoryContext({ env: {}, remote }).repository, 'bob/shop');
  assert.equal(repositoryContext({ env: { GITHUB_REPOSITORY: 'bob/shop', GITHUB_REPOSITORY_ID: '202' } }).id, '202');
  assert.equal(repositoryContext({ env: { PROJECT_REPOSITORY: 'bob/shop' } }).repository, 'bob/shop');
  assert.throws(() => repositoryContext({ env: {}, remote: 'file:///tmp/repo' }));
  assert.throws(() => repositoryContext({ env: { GITHUB_REPOSITORY: 'bob/shop/other' } }));
});

test('fork and template initialization clear inherited updater identity; reinitialization and renames preserve it', () => {
  const derived = initializeSettings(original, context('bob/shop', '202'), { name: '商店后台' });
  assert.equal(derived.releaseMode, 'basic');
  assert.equal(derived.updaterPublicKey, '');
  assert.equal(derived.updateEndpoint, '');
  assert.equal(derived.releaseEnvironment, '');
  assert.notEqual(derived.identifier, original.identifier);
  assert.notEqual(derived.binaryName, original.binaryName);
  assert.deepEqual(initializeSettings(derived, context('bob/shop', '202')), derived);
  const renamed = initializeSettings(original, context('alice/renamed', '101'));
  assert.equal(renamed.identifier, original.identifier);
  assert.equal(renamed.updaterPublicKey, original.updaterPublicKey);
  assert.equal(renamed.releaseEnvironment, original.releaseEnvironment);
  assert.throws(() => initializeSettings(original, context('alice/base', '101'), { identifier: 'com.other.app' }));
  assert.throws(() => resolveProject(original, context('bob/shop', '202')), /project:init/);
  assert.throws(
    () => resolveProject(original, { ...context('alice/base', '101'), server: 'https://other.example.com' }),
    /project:init/
  );
});

test('basic builds ignore inherited signing environment; updater-enabled release cannot silently downgrade', () => {
  const settings = resolveProject(initializeSettings(original, context('bob/shop', '202')), context('bob/shop', '202'));
  const build = desktopConfig({
    settings,
    version: '1.0.0',
    release: true,
    signing: { DESKTOP_UPDATER_PUBLIC_KEY: 'old-key' }
  });
  assert.equal(build.config.bundle.createUpdaterArtifacts, false);
  assert.equal(build.env.VITE_DESKTOP_UPDATER_ENABLED, 'N');
  assert.equal(build.config.plugins, undefined);
  assert.equal(settings.updateEndpoint, 'https://github.com/bob/shop/releases/latest/download/latest.json');
  assert.throws(
    () => desktopConfig({ settings: { ...settings, releaseMode: 'updater' }, version: '1.0.0', release: true }),
    /TAURI_SIGNING_PRIVATE_KEY/
  );
  const signed = desktopConfig({
    settings: { ...settings, releaseMode: 'updater', updaterPublicKey: 'new-public-key' },
    version: '1.0.0',
    release: true,
    signing: { TAURI_SIGNING_PRIVATE_KEY: 'private-fixture' }
  });
  assert.equal(signed.config.plugins.updater.pubkey, 'new-public-key');
  assert.equal(signed.config.plugins.updater.endpoints[0], settings.updateEndpoint);
  assert.equal(signed.config.bundle.createUpdaterArtifacts, true);
  assert.throws(
    () =>
      desktopConfig({
        settings: { ...settings, releaseMode: 'updater', updaterPublicKey: 'current-key' },
        version: '1.0.0',
        signing: { DESKTOP_UPDATER_PUBLIC_KEY: 'old-key' }
      }),
    /differs/
  );
});

test('fresh derived repository releases from a non-main branch without historical Actions runs', () => {
  const temporaryRoot = os.tmpdir();
  const temporary = mkdtempSync(path.join(temporaryRoot, 'admin-portability-'));
  const repo = path.join(temporary, 'project');
  const remote = path.join(temporary, 'remote.git');
  mkdirSync(repo);
  symlinkSync(path.join(root, 'node_modules'), path.join(repo, 'node_modules'), 'junction');
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) =>
        !key.startsWith('GITHUB_') &&
        !key.startsWith('GH_') &&
        !key.startsWith('PROJECT_') &&
        !key.startsWith('TAURI_SIGNING') &&
        key !== 'DESKTOP_UPDATER_PUBLIC_KEY'
    )
  );
  const git = (...args) =>
    execFileSync('git', args, { cwd: repo, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const run = (script, args = [], extra = {}) =>
    execFileSync(process.execPath, ['scripts/' + script, ...args], {
      cwd: repo,
      env: { ...env, ...extra },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
  try {
    cpSync(path.join(root, 'scripts'), path.join(repo, 'scripts'), { recursive: true });
    for (const file of [
      'desktop.json',
      'package.json',
      'frontend/src-tauri/Cargo.toml',
      'frontend/src-tauri/Cargo.lock',
      'frontend/src-tauri/tauri.conf.json'
    ]) {
      mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
      cpSync(path.join(root, file), path.join(repo, file));
    }
    git('init', '-b', 'develop');
    git('config', 'user.name', 'Fixture');
    git('config', 'user.email', 'fixture@example.test');
    git('config', 'commit.gpgsign', 'false');
    git('config', 'core.hooksPath', path.join(temporary, 'no-hooks'));
    git('remote', 'add', 'origin', 'git@github.com:another-owner/custom-app.git');
    run('project-init.mjs', ['--offline', '--name', 'Custom App']);
    const settings = JSON.parse(readFileSync(path.join(repo, 'desktop.json')));
    run('project-init.mjs', ['--offline']);
    assert.deepEqual(JSON.parse(readFileSync(path.join(repo, 'desktop.json'))), settings);
    run('project-version.mjs', ['1.2.3']);
    assert.equal(JSON.parse(readFileSync(path.join(repo, 'frontend/src-tauri/tauri.conf.json'))).version, '1.2.3');
    assert.ok(readFileSync(path.join(repo, 'frontend/src-tauri/Cargo.lock'), 'utf8').includes('version = "1.2.3"'));
    writeFileSync(path.join(repo, '.gitignore'), 'node_modules/\n.release-keys/\n.release-artifacts/\n');
    git('add', '.');
    git('commit', '-m', 'Initial application');
    git('tag', 'v1.2.3');
    git('init', '--bare', remote);
    git('remote', 'set-url', 'origin', remote);
    git('push', 'origin', 'develop', 'v1.2.3');
    const event = path.join(temporary, 'event.json');
    const output = path.join(temporary, 'output.txt');
    writeFileSync(event, JSON.stringify({ repository: { default_branch: 'develop' } }));
    const github = {
      GITHUB_REPOSITORY: 'another-owner/custom-app',
      GITHUB_EVENT_PATH: event,
      GITHUB_OUTPUT: output,
      GITHUB_EVENT_NAME: 'workflow_dispatch',
      GITHUB_REF: 'refs/heads/develop',
      RELEASE_TAG: 'v1.2.3'
    };
    assert.match(run('release-source.mjs', [], github), /default branch develop/);
    assert.match(readFileSync(output, 'utf8'), /mode=basic/);
    assert.match(run('release-check.mjs', [], github), /basic/);
    symlinkSync(path.join(root, 'frontend/node_modules'), path.join(repo, 'frontend/node_modules'), 'junction');
    const initialized = run('project-init.mjs', ['--offline', '--updater'], github);
    const updater = JSON.parse(readFileSync(path.join(repo, 'desktop.json')));
    const keyPath = path.join(repo, '.release-keys', updater.identifier + '.key');
    const backup = readFileSync(keyPath);
    assert.equal(updater.releaseMode, 'updater');
    assert.ok(updater.updaterPublicKey);
    assert.ok(!initialized.includes(backup.toString().trim()));
    run('project-init.mjs', ['--offline', '--updater'], github);
    assert.deepEqual(readFileSync(keyPath), backup);
    rmSync(keyPath);
    assert.throws(() => run('project-init.mjs', ['--offline', '--updater'], github));
    assert.equal(JSON.parse(readFileSync(path.join(repo, 'desktop.json'))).updaterPublicKey, updater.updaterPublicKey);
    writeFileSync(path.join(repo, 'desktop.json'), JSON.stringify(settings));
    assert.throws(() => run('release-source.mjs', [], { ...github, GITHUB_REF: 'refs/heads/main' }));
    assert.throws(() => run('release-source.mjs', [], { ...github, RELEASE_TAG: 'v0.0.1' }));

    const directory = path.join(repo, '.release-artifacts');
    mkdirSync(directory);
    const sha = git('rev-parse', 'HEAD');
    const builds = ['windows-x86_64', 'darwin-aarch64', 'linux-x86_64'].map(platform => ({
      platform,
      version: '1.2.3',
      identifier: settings.identifier,
      repository: github.GITHUB_REPOSITORY,
      sha,
      releaseMode: 'basic',
      assets: [platform + '.package']
    }));
    const save = () => {
      for (const build of builds) {
        writeFileSync(path.join(directory, 'build-' + build.platform + '.json'), JSON.stringify(build));
        for (const asset of build.assets) writeFileSync(path.join(directory, asset), 'fixture');
      }
    };
    save();
    writeFileSync(path.join(directory, 'latest.json'), 'stale');
    run('release-manifest.mjs', [], github);
    assert.equal(existsSync(path.join(directory, 'latest.json')), false);
    assert.match(readFileSync(path.join(directory, 'release-notes.md'), 'utf8'), /Custom App 1.2.3/);
    builds[0].sha = 'wrong-source';
    save();
    assert.throws(() => run('release-manifest.mjs', [], github));
    builds[0].sha = sha;
    settings.releaseMode = 'updater';
    writeFileSync(path.join(repo, 'desktop.json'), JSON.stringify(settings));
    for (const build of builds) {
      build.releaseMode = 'updater';
      build.update = { file: build.assets[0], signature: 'signed-fixture' };
      if (build.platform.startsWith('linux-'))
        build.updates = { [build.platform + '-appimage']: build.update, [build.platform + '-deb']: build.update };
    }
    save();
    run('release-manifest.mjs', [], github);
    const manifest = JSON.parse(readFileSync(path.join(directory, 'latest.json')));
    assert.ok(
      Object.values(manifest.platforms).every(item =>
        item.url.startsWith('https://github.com/another-owner/custom-app/releases/download/v1.2.3/')
      )
    );
    git('checkout', '--orphan', 'untrusted');
    git('commit', '-m', 'Unrelated history');
    git('tag', '-f', 'v1.2.3');
    assert.throws(() => run('release-source.mjs', [], github));
    assert.equal(
      spawnSync('git', ['log', '-1', '--format=%s'], { cwd: repo, encoding: 'utf8' }).stdout.trim(),
      'Unrelated history'
    );
  } finally {
    if (path.dirname(temporary) !== temporaryRoot || !path.basename(temporary).startsWith('admin-portability-'))
      throw new Error('Unexpected fixture path');
    rmSync(temporary, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
});
