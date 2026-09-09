import { onScopeDispose, shallowRef } from 'vue';
import { check } from '@tauri-apps/plugin-updater';
import type { Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export function useDesktopUpdate() {
  const currentVersion = import.meta.env.VITE_APP_VERSION || '0.1.0';
  const state = shallowRef<'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'>('idle');
  const release = shallowRef<Update | null>(null);
  const progress = shallowRef(0);
  const message = shallowRef('');
  let disposed = false;
  async function checkUpdate() {
    if (['checking', 'downloading', 'ready'].includes(state.value)) return;
    state.value = 'checking';
    message.value = '';
    try {
      await release.value?.close();
      release.value = null;
      const update = await check({ timeout: 15000 });
      if (disposed) {
        await update?.close();
        return;
      }
      release.value = update;
      state.value = update ? 'available' : 'idle';
      message.value = update ? '发现可用更新。' : '当前已是最新版本。';
    } catch {
      state.value = 'error';
      message.value = '更新检查失败，请检查网络后重试。';
    }
  }
  async function installUpdate() {
    if (!release.value || state.value === 'downloading') return;
    state.value = 'downloading';
    progress.value = 0;
    let downloaded = 0;
    let total = 0;
    try {
      await release.value.downloadAndInstall(event => {
        if (event.event === 'Started') total = event.data.contentLength || 0;
        if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          progress.value = total ? Math.min(99, Math.round((downloaded / total) * 100)) : 0;
        }
      });
      progress.value = 100;
      state.value = 'ready';
      message.value = '更新已安装，请重启应用。';
    } catch {
      state.value = 'error';
      message.value = '下载、签名校验或安装失败，当前版本继续可用，请重试。';
    }
  }
  async function restart() {
    try {
      await relaunch();
    } catch {
      message.value = '自动重启失败，请手动关闭并重新打开应用。';
    }
  }
  onScopeDispose(() => {
    disposed = true;
    if (state.value !== 'downloading') void release.value?.close();
  });
  return { currentVersion, state, release, progress, message, checkUpdate, installUpdate, restart };
}
