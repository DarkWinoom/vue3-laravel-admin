import path from 'node:path';

// Tauri keeps older versioned bundles in the target directory between builds.
export function currentPackages(files, { version, productName, binaryName }) {
  const names = new Set(
    [productName, binaryName]
      .filter(Boolean)
      .flatMap(name => [name, name.replaceAll(' ', '-'), name.toLowerCase().replaceAll(' ', '-')])
  );
  return files.filter(file => {
    const name = path.basename(file).replace(/\.sig$/, '');
    if (name.endsWith('.app.tar.gz')) return names.has(name.slice(0, -'.app.tar.gz'.length));
    if (!/\.(exe|msi|dmg|deb|AppImage)$/.test(name)) return false;
    const marker = '_' + version + '_';
    const at = name.indexOf(marker);
    return at > 0 && names.has(name.slice(0, at));
  });
}

export function requireSinglePackage(files, extension) {
  const matches = files.filter(file => file.endsWith(extension));
  if (matches.length !== 1)
    throw new Error('Expected exactly one current ' + extension + ' package, found ' + matches.length);
  return matches[0];
}
