import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { appSettings } from './desktop-config.mjs';
import { githubEvent } from './repository.mjs';
const event = githubEvent();
const branch = event.repository?.default_branch;
const tag = process.env.RELEASE_TAG;
const { settings, version } = appSettings();
if (tag !== 'v' + version) throw new Error('Release tag must match package.json version');
if (!branch) throw new Error('GitHub default branch is required');
const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
git(['check-ref-format', 'refs/heads/' + branch]);
git(['fetch', '--no-tags', 'origin', '+refs/heads/' + branch + ':refs/remotes/origin/' + branch]);
const sha = git(['rev-parse', 'HEAD']);
const tagged = git(['rev-parse', 'refs/tags/' + tag + '^{commit}']);
if (sha !== tagged) throw new Error('Checkout must be the exact release tag commit');
git(['merge-base', '--is-ancestor', sha, 'refs/remotes/origin/' + branch]);
if (process.env.GITHUB_EVENT_NAME === 'workflow_dispatch' && process.env.GITHUB_REF !== 'refs/heads/' + branch)
  throw new Error('Dispatch releases from the repository default branch');
const environment = settings.releaseEnvironment || '';
if (/[\r\n]/.test(environment)) throw new Error('Invalid release environment');
if (process.env.GITHUB_OUTPUT)
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    'sha=' + sha + '\ntag=' + tag + '\nmode=' + settings.releaseMode + '\nenvironment=' + environment + '\n'
  );
console.log(
  'Verified tag ' +
    tag +
    ' at ' +
    sha +
    ' on default branch ' +
    branch +
    '. Complete checks run on this commit in the release workflow.'
);
