import assert from 'node:assert/strict';
import test from 'node:test';
import { currentPackages, requireSinglePackage } from '../package-files.mjs';
test('repeated desktop builds select current application packages, never old installers', () => {
  const files = [
    '/bundle/My Admin_0.1.1_x64-setup.exe',
    '/bundle/My Admin_0.1.2_x64-setup.exe',
    '/bundle/My Admin_0.1.2_x64-setup.exe.sig',
    '/bundle/Other Admin_0.1.2_x64-setup.exe',
    '/bundle/My Admin Test_0.1.2_x64-setup.exe',
    '/bundle/my-admin_0.1.2_amd64.deb',
    '/bundle/My Admin_0.1.2_aarch64.dmg',
    '/bundle/My Admin.app.tar.gz',
    '/bundle/Other Admin.app.tar.gz'
  ];
  const current = currentPackages(files, { version: '0.1.2', productName: 'My Admin' });
  assert.deepEqual(current, [files[1], files[2], files[5], files[6], files[7]]);
  assert.equal(requireSinglePackage(current, '.exe'), files[1]);
  assert.throws(() => requireSinglePackage([], '.exe'), /exactly one/);
  assert.throws(() => requireSinglePackage([files[1], '/another/' + files[1]], '.exe'), /exactly one/);
});
test('derived binary names and prerelease versions are matched literally', () => {
  assert.deepEqual(
    currentPackages(['app-123_1.2.3-beta.1_amd64.deb', 'app-123_1.2.3_amd64.deb'], {
      version: '1.2.3-beta.1',
      productName: '客户管理',
      binaryName: 'app-123'
    }),
    ['app-123_1.2.3-beta.1_amd64.deb']
  );
});
