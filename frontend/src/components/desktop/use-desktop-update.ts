import { computed, onScopeDispose, shallowRef } from 'vue';
import { check } from '@tauri-apps/plugin-updater';
import type { Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

type Release = Pick<Update, 'version' | 'body' | 'close' | 'downloadAndInstall'>;
type Dependencies = { check: () => Promise<Release | null>; relaunch: () => Promise<void> };

export function useDesktopUpdate(
  dependencies: Dependencies = { check: () => check({ timeout: 15000 }), relaunch },
  currentVersion = import.meta.env.VITE_APP_VERSION || '0.1.0'
) {
  const state = shallowRef<'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'>('idle');
  const release = shallowRef<Release | null>(null);
  const progress = shallowRef(0);
  const message = shallowRef('');
  const busy = computed(() => ['checking', 'downloading', 'ready'].includes(state.value));
  let disposed = false;
  async function close(update: Release | null) {
    await update?.close().catch(() => {});
  }
  async function checkUpdate() {
    if (disposed || busy.value) return;
    state.value = 'checking';
    message.value = '';
    const previous = release.value;
    release.value = null;
    await close(previous);
    try {
      const update = await dependencies.check();
      if (disposed) {
        await close(update);
        return;
      }
      release.value = update;
      state.value = update ? 'available' : 'idle';
      message.value = update ? '发现可用更新。' : '当前已是最新版本。';
    } catch {
      if (disposed) return;
      state.value = 'error';
      message.value = '更新检查失败，请检查网络后重试。';
    }
  }
  async function installUpdate() {
    if (disposed || !release.value || busy.value) return;
    const update = release.value;
    state.value = 'downloading';
    message.value = '';
    progress.value = 0;
    let downloaded = 0;
    let total = 0;
    try {
      await update.downloadAndInstall(event => {
        if (disposed) return;
        if (event.event === 'Started') total = event.data.contentLength || 0;
        if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          progress.value = total ? Math.min(99, Math.round((downloaded / total) * 100)) : 0;
        }
      });
      if (disposed) return;
      progress.value = 100;
      state.value = 'ready';
      message.value = '更新已安装，请重启应用。';
    } catch {
      if (disposed) return;
      state.value = 'error';
      message.value = '下载、签名校验或安装失败，当前版本继续可用，请重试。';
    } finally {
      if (disposed) await close(update);
    }
  }
  async function restart() {
    if (disposed || state.value !== 'ready') return;
    try {
      await dependencies.relaunch();
    } catch {
      message.value = '自动重启失败，请手动关闭并重新打开应用。';
    }
  }
  onScopeDispose(() => {
    disposed = true;
    if (state.value !== 'downloading') void close(release.value);
  });
  return { currentVersion, state, busy, release, progress, message, checkUpdate, installUpdate, restart };
}
