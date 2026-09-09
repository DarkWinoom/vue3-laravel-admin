import { execFileSync } from 'node:child_process';
const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GH_TOKEN;
if (!repo || !/^[-\w.]+\/[-\w.]+$/.test(repo) || !token)
  throw new Error('GitHub release verification environment required');
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const response = await fetch(
  'https://api.github.com/repos/' +
    repo +
    '/actions/workflows/ci.yml/runs?head_sha=' +
    sha +
    '&event=push&per_page=100',
  {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(30000)
  }
);
if (!response.ok) throw new Error('Unable to verify release CI: HTTP ' + response.status);
const runs = (await response.json()).workflow_runs;
if (!runs.some(run => run.head_sha === sha && run.head_branch === 'main' && run.conclusion === 'success'))
  throw new Error('Release commit must have a successful complete main CI run, including all desktop platforms');
console.log('Verified complete CI for release commit ' + sha);
