export function validateReleaseBuilds(builds, version, expected = {}) {
  for (const os of ['windows-', 'darwin-', 'linux-'])
    if (builds.filter(build => build.platform.startsWith(os)).length !== 1)
      throw new Error('Incomplete or duplicate platform set: ' + os);
  if (builds.length !== 3) throw new Error('Unexpected release platform');
  const seen = new Set();
  for (const build of builds) {
    if (build.version !== version || seen.has(build.platform)) throw new Error('Mismatched or duplicate release build');
    seen.add(build.platform);
    if (!build.assets?.length || build.assets.some(file => !/^[^/\\]+$/.test(file) || file === '..'))
      throw new Error('Invalid release assets');
    for (const [field, value] of Object.entries(expected))
      if (build[field] !== value) throw new Error('Mismatched build ' + field);
  }
}

export function releasePlatforms(builds, version, repo, server = 'https://github.com') {
  if (!/^[-\w.]+\/[-\w.]+$/.test(repo || '')) throw new Error('GITHUB_REPOSITORY required');
  const origin = new URL(server);
  if (
    origin.protocol !== 'https:' ||
    origin.username ||
    origin.password ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash
  )
    throw new Error('Invalid release server');
  validateReleaseBuilds(builds, version);
  const platforms = {};
  for (const build of builds) {
    if (!build.update) throw new Error('Missing default signed update');
    const updates = { [build.platform]: build.update, ...build.updates };
    if (build.platform.startsWith('linux-'))
      for (const format of ['appimage', 'deb'])
        if (!updates[build.platform + '-' + format]) throw new Error('Missing Linux updater format: ' + format);
    for (const [target, update] of Object.entries(updates)) {
      if (
        !(target === build.platform || target === build.platform + '-appimage' || target === build.platform + '-deb') ||
        !update?.signature ||
        !build.assets.includes(update.file)
      )
        throw new Error('Invalid updater artifact reference');
      platforms[target] = {
        signature: update.signature,
        url: origin.origin + '/' + repo + '/releases/download/v' + version + '/' + encodeURIComponent(update.file)
      };
    }
  }
  return platforms;
}
