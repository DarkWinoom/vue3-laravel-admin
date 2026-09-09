import assert from 'node:assert/strict';
import test from 'node:test';
import { releasePlatforms } from '../release-platforms.mjs';
function builds() {
  return ['windows-x86_64', 'darwin-aarch64', 'linux-x86_64'].map(platform => {
    const extension = platform.startsWith('linux') ? 'AppImage' : platform.startsWith('windows') ? 'exe' : 'app.tar.gz';
    const file = platform + '.' + extension;
    const update = { file, signature: 'test-signature' };
    return {
      platform,
      version: '0.1.0',
      assets: [file, platform + '.deb'],
      update,
      ...(platform.startsWith('linux')
        ? {
            updates: {
              [platform + '-appimage']: update,
              [platform + '-deb']: { file: platform + '.deb', signature: 'deb-signature' }
            }
          }
        : {})
    };
  });
}
test('Linux clients receive a signed update matching their package format', () => {
  const platforms = releasePlatforms(builds(), '0.1.0', 'owner/repo');
  assert.ok(platforms['linux-x86_64-appimage'].url.endsWith('.AppImage'));
  assert.ok(platforms['linux-x86_64-deb'].url.endsWith('.deb'));
  assert.equal(platforms['linux-x86_64-deb'].signature, 'deb-signature');
});
test('incomplete platforms, mismatched versions and missing deb updates cannot publish', () => {
  assert.throws(() => releasePlatforms(builds().slice(0, 2), '0.1.0', 'owner/repo'), /Incomplete/);
  assert.throws(() => releasePlatforms(builds(), '0.2.0', 'owner/repo'), /Mismatched/);
  const missing = builds();
  delete missing[2].updates['linux-x86_64-deb'];
  assert.throws(() => releasePlatforms(missing, '0.1.0', 'owner/repo'), /Missing Linux/);
  const broken = builds();
  broken[0].update.file = 'missing.exe';
  assert.throws(() => releasePlatforms(broken, '0.1.0', 'owner/repo'), /Invalid updater/);
});
