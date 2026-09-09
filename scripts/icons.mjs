import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const { getIconData } = require('@iconify/utils');
const root = fileURLToPath(new URL('../frontend/src', import.meta.url));
const target = join(root, 'assets/icons/management.json');
const existing = JSON.parse(readFileSync(target, 'utf8'));
const names = new Set(
  existing.flatMap(collection => Object.keys(collection.icons).map(name => `${collection.prefix}:${name}`))
);
for (const icon of ['mdi:clipboard-text-clock-outline', 'mdi:book-open-page-variant-outline', 'mdi:help-circle'])
  names.add(icon);
function scan(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) scan(path);
    else if (/\.(vue|ts)$/.test(path)) {
      for (const match of readFileSync(path, 'utf8').matchAll(/['"]([a-z][a-z0-9-]*:[a-z0-9-]+)['"]/g))
        names.add(match[1]);
    }
  }
}
scan(root);
const collections = new Map();
for (const fullName of [...names].sort()) {
  const [prefix, name] = fullName.split(':');
  let collection = collections.get(prefix);
  if (!collection) {
    let source;
    try {
      source = JSON.parse(readFileSync(require.resolve(`@iconify/json/json/${prefix}.json`), 'utf8'));
    } catch {
      continue;
    }
    collection = {
      source,
      output: { prefix, width: source.width || 16, height: source.height || 16, info: source.info, icons: {} }
    };
    collections.set(prefix, collection);
  }
  const icon = getIconData(collection.source, name);
  if (!icon) throw new Error(`Unknown local icon: ${fullName}`);
  collection.output.icons[name] = icon;
}
const result = [...collections.values()].map(item => item.output);
writeFileSync(
  target,
  await format(JSON.stringify(result), { ...(await resolveConfig(target, { editorconfig: true })), parser: 'json' })
);
console.log(
  `Bundled ${result.reduce((count, item) => count + Object.keys(item.icons).length, 0)} local icons in ${dirname(target)}.`
);
