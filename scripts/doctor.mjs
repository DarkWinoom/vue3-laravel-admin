import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { root, backendEnvironment, readEnv } from './env.mjs';

console.log(`Node ${process.version}`);
const checks = [
  ['pnpm', ['--version'], root],
  ['composer', ['--version'], root],
  [
    'php',
    [
      '-r',
      'echo "PHP ".PHP_VERSION.PHP_EOL; foreach (["mbstring", "openssl", "pdo_mysql", "pdo_sqlite", "xml", "curl", "fileinfo", "zip"] as $extension) { if (!extension_loaded($extension)) { fwrite(STDERR, "Missing PHP extension: ".$extension.PHP_EOL); exit(1); } }'
    ],
    root
  ]
];
if (process.argv.includes('--desktop')) {
  checks.push(['rustc', ['--version'], root], ['cargo', ['--version'], root]);
  checks.push([process.execPath, ['node_modules/@tauri-apps/cli/tauri.js', 'info'], path.join(root, 'frontend')]);
}
if (process.argv.includes('--database')) {
  readEnv('backend/.env.development');
  checks.push([
    'php',
    [
      '-r',
      'require "vendor/autoload.php"; $app = require "bootstrap/app.php"; $app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); try { $pdo = Illuminate\\Support\\Facades\\DB::connection()->getPdo(); if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) !== "mysql") { throw new RuntimeException(); } $pdo->query("SELECT 1"); echo "MySQL connected".PHP_EOL; } catch (Throwable $e) { fwrite(STDERR, "MySQL connection failed; check backend/.env.development".PHP_EOL); exit(1); }'
    ],
    path.join(root, 'backend')
  ]);
}
for (const [command, args, cwd] of checks) {
  const result = spawnSync(command, args, {
    cwd,
    env: backendEnvironment(),
    shell: process.platform === 'win32' && ['pnpm', 'composer'].includes(command),
    stdio: 'inherit'
  });
  if (result.error) console.error(result.error.message);
  if (result.error || result.status !== 0) process.exitCode = 1;
}
