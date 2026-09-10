import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { root } from './env.mjs';

export function nativeMetadata() {
  const metadata = JSON.parse(
    execFileSync('cargo', ['metadata', '--no-deps', '--locked', '--format-version', '1'], {
      cwd: path.join(root, 'frontend/src-tauri'),
      encoding: 'utf8',
      windowsHide: true
    })
  );
  const app = metadata.packages.find(
    pkg => path.resolve(pkg.manifest_path) === path.join(root, 'frontend/src-tauri/Cargo.toml')
  );
  const binaries = app.targets.filter(target => target.kind.includes('bin'));
  if (binaries.length !== 1) throw new Error('Desktop tests require one Cargo binary target');
  return {
    binary:
      JSON.parse(readFileSync(path.join(root, 'frontend/src-tauri/tauri.conf.json'), 'utf8')).mainBinaryName ||
      binaries[0].name,
    target: metadata.target_directory
  };
}
