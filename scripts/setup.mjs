import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { root } from './env.mjs';

for (const name of ['.env', '.env.development', '.env.testing', '.env.production']) {
  const target = path.join(root, name);
  if (existsSync(target)) continue;
  const content = readFileSync(`${target}.example`, 'utf8').replace(
    /^(APP_KEY|JWT_SECRET|DOCKER_DB_PASSWORD|MYSQL_ROOT_PASSWORD)=\r?$/gm,
    (_, key) =>
      `${key}=${key === 'APP_KEY' ? `base64:${randomBytes(32).toString('base64')}` : randomBytes(32).toString('hex')}`
  );
  writeFileSync(target, content);
  console.log(`Created ${name}`);
}
