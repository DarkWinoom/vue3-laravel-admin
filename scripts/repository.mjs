import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { root } from './env.mjs';

export function repositoryContext({ env = process.env, remote, cwd = root } = {}) {
  let repository = env.GITHUB_REPOSITORY || env.PROJECT_REPOSITORY;
  let server = env.GITHUB_SERVER_URL || 'https://github.com';
  if (!repository) {
    const source =
      remote ?? execFileSync('git', ['remote', 'get-url', '--push', 'origin'], { cwd, encoding: 'utf8' }).trim();
    const ssh = source.match(/^git@([^:]+):(.+)$/);
    const url = new URL(ssh ? 'ssh://git@' + ssh[1] + '/' + ssh[2] : source);
    if (!['https:', 'ssh:'].includes(url.protocol))
      throw new Error('Use a GitHub HTTPS/SSH origin or PROJECT_REPOSITORY');
    server = 'https://' + url.hostname;
    repository = url.pathname
      .replace(/^\//, '')
      .replace(/\.git\/?$/, '')
      .replace(/\/$/, '');
  }
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('Invalid GitHub repository; expected owner/repo');
  const url = new URL(server);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash)
    throw new Error('GitHub server must be an HTTPS origin');
  return {
    repository,
    server: url.origin,
    id: env.GITHUB_REPOSITORY_ID || '',
    api: env.GITHUB_API_URL || (url.hostname === 'github.com' ? 'https://api.github.com' : url.origin + '/api/v3')
  };
}

export function githubEvent(env = process.env) {
  return env.GITHUB_EVENT_PATH ? JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8')) : {};
}

export function resolveProject(settings, context) {
  const binding = settings.repository;
  const sameRepository =
    binding &&
    (binding.id && context.id
      ? String(binding.id) === String(context.id) && (binding.server || 'https://github.com') === context.server
      : binding.name.toLowerCase() === context.repository.toLowerCase() &&
        (binding.server || 'https://github.com') === context.server);
  if (!sameRepository)
    throw new Error('请先运行 pnpm project:init，将 desktop.json 绑定到自己的仓库；不会沿用其他应用的标识或更新密钥。');
  const releaseMode = settings.releaseMode || 'basic';
  if (!['basic', 'updater'].includes(releaseMode)) throw new Error('releaseMode must be basic or updater');
  return {
    ...settings,
    releaseMode,
    updateEndpoint:
      settings.updateEndpoint || context.server + '/' + context.repository + '/releases/latest/download/latest.json'
  };
}
