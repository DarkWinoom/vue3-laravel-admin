import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { backendEnvironment } from './env.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = new URL('../backend/storage/framework/contract-openapi.json', import.meta.url);
const result = spawnSync('php', ['artisan', 'scramble:export', '--path=storage/framework/contract-openapi.json'], {
  cwd: new URL('../backend', import.meta.url),
  env: backendEnvironment('testing'),
  stdio: 'inherit'
});
if (result.status !== 0) process.exit(result.status ?? 1);
try {
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
  rmSync(temporary, { force: true });
}
