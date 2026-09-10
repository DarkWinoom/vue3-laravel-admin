import { readdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { releasePlatforms, validateReleaseBuilds } from './release-platforms.mjs';
import { appSettings } from './desktop-config.mjs';
import { repositoryContext } from './repository.mjs';
const { settings, version } = appSettings();
const context = repositoryContext();
if (process.env.RELEASE_TAG !== 'v' + version) throw new Error('Release version mismatch');
const directory = '.release-artifacts';
const builds = readdirSync(directory)
  .filter(n => /^build-.*\.json$/.test(n))
  .map(n => JSON.parse(readFileSync(directory + '/' + n, 'utf8')));
validateReleaseBuilds(builds, version, {
  identifier: settings.identifier,
  repository: context.repository,
  releaseMode: settings.releaseMode,
  sha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
});
for (const build of builds)
  for (const asset of build.assets)
    if (!existsSync(directory + '/' + asset)) throw new Error('Missing release asset: ' + asset);
const listedAssets = new Set(builds.flatMap(build => build.assets));
const stalePackages = readdirSync(directory).filter(
  name => /\.(exe|msi|dmg|deb|AppImage|app\.tar\.gz)(\.sig)?$/.test(name) && !listedAssets.has(name)
);
if (stalePackages.length)
  throw new Error('Unlisted release packages: ' + stalePackages.join(', ') + '. Use a clean artifact directory.');
const signed = settings.releaseMode === 'updater';
if (signed) {
  const platforms = releasePlatforms(builds, version, context.repository, context.server);
  writeFileSync(
    directory + '/latest.json',
    JSON.stringify(
      { version, notes: settings.productName + ' ' + version, pub_date: new Date().toISOString(), platforms },
      null,
      2
    ) + '\n'
  );
} else {
  rmSync(directory + '/latest.json', { force: true });
}
writeFileSync(
  directory + '/release-notes.md',
  '# ' +
    settings.productName +
    ' ' +
    version +
    '\n\n此版本为验收草稿。首次启动请配置自己的 HTTPS 服务地址。包含 Windows、macOS、Linux 客户端、校验和及许可清单。\n\n' +
    (signed
      ? '包含 Tauri 签名更新文件。请验证安装和签名升级后再公开发布。更新签名不同于操作系统代码签名。'
      : '本版本为普通发布，在线更新关闭；安装新版客户端即可更新。请完成安装与业务验收后再公开发布。') +
    '\n'
);
console.log('Complete ' + settings.releaseMode + ' release metadata generated for ' + context.repository + '.');
