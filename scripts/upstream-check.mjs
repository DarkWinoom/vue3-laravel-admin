import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const baseline = JSON.parse(readFileSync('upstream.json', 'utf8'));
if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?$/.test(baseline.repository))
  throw new Error('Expected a GitHub HTTPS upstream');
const sources = [
  { branch: baseline.branch, commit: baseline.commit },
  { branch: baseline.referenceBranch, commit: baseline.referenceCommit }
];
for (const item of sources)
  if (!/^[\w./-]+$/.test(item.branch) || item.branch.startsWith('-') || !/^[a-f0-9]{40}$/.test(item.commit))
    throw new Error('Invalid upstream reference');
const candidate = { repository: baseline.repository, baseline: {}, heads: {} };
for (const item of sources) {
  const line = execFileSync('git', ['ls-remote', baseline.repository, 'refs/heads/' + item.branch], {
    encoding: 'utf8',
    timeout: 120000
  });
  const sha = line.split(/\s+/)[0];
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Missing upstream branch ' + item.branch);
  candidate.baseline[item.branch] = item.commit;
  candidate.heads[item.branch] = sha;
}
if (sources.every(item => item.commit === candidate.heads[item.branch])) {
  console.log('Upstream pins are current.');
  process.exit(0);
}
mkdirSync('test-results/upstream', { recursive: true });
const temporary = mkdtempSync(path.join(os.tmpdir(), 'vue3-upstream-'));
try {
  execFileSync('git', ['init', temporary], { stdio: 'ignore' });
  for (const item of sources) {
    const latest = candidate.heads[item.branch];
    if (item.commit === latest) continue;
    for (const ref of [item.commit, latest])
      execFileSync('git', ['-C', temporary, 'fetch', '--depth=1', baseline.repository, ref], {
        stdio: 'ignore',
        timeout: 120000
      });
    const diff = execFileSync('git', ['-C', temporary, 'diff', '--binary', item.commit, latest], {
      maxBuffer: 50 * 1024 * 1024
    });
    writeFileSync('test-results/upstream/' + item.branch.replaceAll('/', '-') + '.patch', diff);
  }
  writeFileSync('upstream-candidate.json', JSON.stringify(candidate, null, 2) + '\n');
  console.log('Upstream proposal generated; application sources and upstream.json were not changed.');
} finally {
  if (path.dirname(path.resolve(temporary)) !== path.resolve(os.tmpdir()))
    throw new Error('Unexpected temporary directory');
  rmSync(temporary, { recursive: true, force: true, maxRetries: 3 });
}
