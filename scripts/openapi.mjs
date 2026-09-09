import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, mkdtempSync, realpathSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { backendEnvironment } from './env.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporaryRoot = realpathSync(os.tmpdir());
const directory = mkdtempSync(path.join(temporaryRoot, 'vue3-contract-'));
const temporary = path.join(directory, 'openapi.json');
const database = path.join(directory, 'contract_testing');
writeFileSync(database, '');
const env = {
  ...backendEnvironment('testing'),
  DB_CONNECTION: 'sqlite',
  DB_DATABASE: database,
  DB_URL: '',
  APP_CONFIG_CACHE: path.join(directory, 'config.php')
};
try {
  for (const args of [
    ['artisan', 'migrate', '--force', '--quiet'],
    ['artisan', 'scramble:export', '--path=' + temporary]
  ]) {
    const result = spawnSync('php', args, { cwd: new URL('../backend', import.meta.url), env, stdio: 'inherit' });
    if (result.status !== 0) throw new Error('Contract schema export failed');
  }
  const require = createRequire(new URL('../frontend/package.json', import.meta.url));
  const { default: openapiTS, astToString } = require('openapi-typescript');
  const spec = JSON.parse(readFileSync(temporary, 'utf8'));
  const config = await resolveConfig(root + 'frontend/src/service/api/openapi.d.ts', { editorconfig: true });
  const generated = await format(astToString(await openapiTS(spec)), { ...config, parser: 'typescript' });
  const files = [
    [
      'backend/openapi.json',
      await format(JSON.stringify(spec), {
        ...(await resolveConfig(root + 'backend/openapi.json', { editorconfig: true })),
        parser: 'json'
      })
    ],
    ['frontend/src/service/api/openapi.d.ts', generated]
  ];
  for (const [path, content] of files) {
    if (process.argv.includes('--check')) {
      if (readFileSync(root + path, 'utf8').replaceAll('\r\n', '\n') !== content)
        throw new Error(`${path} 已过期，请运行 pnpm api:generate`);
    } else writeFileSync(root + path, content);
  }
  console.log(process.argv.includes('--check') ? 'OpenAPI 与前端契约一致。' : '已生成 OpenAPI 与前端契约。');
} finally {
  if (path.dirname(directory) !== temporaryRoot || !path.basename(directory).startsWith('vue3-contract-'))
    throw new Error('Unexpected contract fixture directory');
  rmSync(directory, { recursive: true, force: true, maxRetries: 3 });
}
