import { shallowRef } from 'vue';

export const isDesktopRuntime = '__TAURI_INTERNALS__' in window;
const key = 'vue3-laravel-admin:desktop-api';
export function normalizeApiOrigin(value: string, allowLocal: boolean) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('请输入有效的 HTTPS 服务地址');
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/' ||
    !(url.protocol === 'https:' || (allowLocal && local && url.protocol === 'http:'))
  )
    throw new Error('请输入 HTTPS 服务地址，不包含路径、账号或参数');
  return url.origin;
}
function initial() {
  if (!isDesktopRuntime) return '';
  const value = localStorage.getItem(key) || import.meta.env.VITE_DESKTOP_API_URL || '';
  if (!value) return '';
  try {
    return normalizeApiOrigin(value, import.meta.env.VITE_DESKTOP_ALLOW_LOCAL_HTTP === 'Y');
  } catch {
    return '';
  }
}
export const desktopApiOrigin = shallowRef(initial());
export const desktopPanelVisible = shallowRef(isDesktopRuntime && !desktopApiOrigin.value);
export function saveDesktopOrigin(value: string) {
  const origin = normalizeApiOrigin(value, import.meta.env.VITE_DESKTOP_ALLOW_LOCAL_HTTP === 'Y');
  localStorage.setItem(key, origin);
  desktopApiOrigin.value = origin;
}
export function desktopBaseUrl() {
  if (!desktopApiOrigin.value) throw new Error('请先配置服务地址');
  return desktopApiOrigin.value + '/api/v1';
}
