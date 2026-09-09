export function releasePlatforms(builds, version, repo) {
  if (!/^[-\w.]+\/[-\w.]+$/.test(repo || '')) throw new Error('GITHUB_REPOSITORY required');
  for (const os of ['windows-', 'darwin-', 'linux-'])
    if (!builds.some(build => build.platform.startsWith(os))) throw new Error('Incomplete signed platform set: ' + os);
  const platforms = {};
  const seen = new Set();
  for (const build of builds) {
    if (build.version !== version || seen.has(build.platform)) throw new Error('Mismatched or duplicate release build');
    seen.add(build.platform);
    if (!build.update) throw new Error('Missing default signed update');
    const updates = { [build.platform]: build.update, ...build.updates };
    if (build.platform.startsWith('linux-'))
      for (const format of ['appimage', 'deb'])
        if (!updates[build.platform + '-' + format]) throw new Error('Missing Linux updater format: ' + format);
    for (const [target, update] of Object.entries(updates)) {
      if (!target.startsWith(build.platform) || !update?.signature || !build.assets.includes(update.file))
        throw new Error('Invalid updater artifact reference');
      platforms[target] = {
        signature: update.signature,
        url: 'https://github.com/' + repo + '/releases/download/v' + version + '/' + encodeURIComponent(update.file)
      };
    }
  }
  return platforms;
}
