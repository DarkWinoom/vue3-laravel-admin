import { readFileSync } from 'node:fs';
import { appSettings, desktopConfig } from './desktop-config.mjs';
const { settings, version } = appSettings();
if (process.env.RELEASE_TAG !== 'v' + version) throw new Error('Release tag must match package.json version');
desktopConfig({ settings, version, release: true, signing: process.env });
if (readFileSync('frontend/src-tauri/Cargo.toml', 'utf8').includes('default = ["desktop-e2e"]'))
  throw new Error('Native test feature cannot be a default');
const cargoVersion = readFileSync('frontend/src-tauri/Cargo.toml', 'utf8').match(/^version\s*=\s*"([^"]+)"/m)?.[1];
const tauri = JSON.parse(readFileSync('frontend/src-tauri/tauri.conf.json', 'utf8'));
if (cargoVersion !== version || tauri.version !== version)
  throw new Error('Run pnpm project:version <version> to synchronize desktop versions');
console.log('Release version and ' + settings.releaseMode + ' configuration validated.');
