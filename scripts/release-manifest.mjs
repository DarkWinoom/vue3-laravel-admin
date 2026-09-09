import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { appSettings } from './desktop-config.mjs';
const { version } = appSettings();
const tag = process.env.RELEASE_TAG;
if (tag !== 'v' + version) throw new Error('Release version mismatch');
const directory = '.release-artifacts';
const builds = readdirSync(directory)
  .filter(n => /^build-.*\.json$/.test(n))
  .map(n => JSON.parse(readFileSync(directory + '/' + n, 'utf8')));
for (const os of ['windows-', 'darwin-', 'linux-'])
  if (!builds.some(b => b.platform.startsWith(os) && b.version === version && b.update))
    throw new Error('Incomplete signed platform set: ' + os);
const repo = process.env.GITHUB_REPOSITORY;
if (!repo || !/^[-\w.]+\/[-\w.]+$/.test(repo)) throw new Error('GITHUB_REPOSITORY required');
const platforms = Object.fromEntries(
  builds.map(b => [
    b.platform,
    {
      signature: b.update.signature,
      url: 'https://github.com/' + repo + '/releases/download/' + tag + '/' + encodeURIComponent(b.update.file)
    }
  ])
);
writeFileSync(
  directory + '/latest.json',
  JSON.stringify(
    { version, notes: 'Desktop release ' + version, pub_date: new Date().toISOString(), platforms },
    null,
    2
  ) + '\n'
);
writeFileSync(
  directory + '/release-notes.md',
  '# Vue3 Laravel Admin ' +
    version +
    '\n\n此版本为验收草稿。首次启动请配置自己的 HTTPS 服务地址。包含 Windows、macOS、Linux 客户端及 Tauri 签名更新文件。\n\n请在三平台检查、服务连接和签名更新验收完成后再发布。签名更新校验不同于操作系统代码签名，系统签名状态请参阅开发文档。\n'
);
console.log('Complete signed update manifest generated.');
