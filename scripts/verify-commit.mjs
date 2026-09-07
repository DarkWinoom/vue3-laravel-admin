import { readFileSync } from 'node:fs';

const file = process.argv[2] || '.git/COMMIT_EDITMSG';
const subject = readFileSync(file, 'utf8').split(/\r?\n/)[0];
if (
  !/^(feat|fix|chore|refactor|test|docs|ci|style|build|perf)(\([a-z0-9-]+\))?: [\x20-\x7E]+$/.test(subject) ||
  subject.length > 72
) {
  console.error('Use an English conventional commit subject of at most 72 characters.');
  process.exitCode = 1;
}
