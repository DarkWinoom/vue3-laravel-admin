import { axios } from '@sa/axios';
import type { AxiosRequestConfig, AxiosResponse } from '@sa/axios';
import { useAuthStore } from '@/store/modules/auth';
import { getServiceBaseURL } from '@/utils/service';
import { clearSession, csrfToken, isDesktop, sessionState, setSession } from './session';
import { createSessionRefresh } from './refresh';

interface Envelope<T> {
  code: string;
  msg: string;
  data: T;
  errors?: Record<string, string[]>;
}
const isProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL } = getServiceBaseURL(import.meta.env, isProxy);
const http = axios.create({ baseURL: baseURL.replace(/\/$/, '') + '/api/v1', withCredentials: true, timeout: 15000 });
export const refreshSession = createSessionRefresh({
  revision: () => sessionState.revision,
  apply: setSession,
  clear: clearSession,
  renew: () =>
    http
      .post<
        Envelope<Api.Auth.LoginToken>
      >('/auth/refresh', { client: isDesktop ? 'desktop' : 'web', ...(isDesktop ? { refreshToken: sessionState.refreshToken } : {}) }, { headers: { 'X-CSRF-Token': csrfToken() } })
      .then(({ data }) => data.data)
});

export async function request<T = null>(
  config: AxiosRequestConfig,
  retried = false
): Promise<
  | { data: T; error: null; response: AxiosResponse<Envelope<T>> }
  | { data: null; error: Error; response?: AxiosResponse<Envelope<T>> }
> {
  const sentToken = sessionState.token;
  try {
    const response = await http.request<Envelope<T>>({
      ...config,
      headers: { ...config.headers, Authorization: sentToken ? 'Bearer ' + sentToken : '', 'X-CSRF-Token': csrfToken() }
    });
    return { data: response.data.data, error: null, response };
  } catch (error) {
    if (!axios.isAxiosError<Envelope<T>>(error)) throw error;
    const code = error.response?.data.code;
    if (code === 'TOKEN_EXPIRED' && !retried) {
      const refreshed = (sentToken !== sessionState.token && Boolean(sessionState.token)) || (await refreshSession());
      if (refreshed) return request<T>(config, true);
    }
    if (['TOKEN_EXPIRED', 'SESSION_REVOKED', 'UNAUTHENTICATED'].includes(code ?? '')) {
      await useAuthStore().resetStore();
    }
    window.$message?.error(error.response?.data.msg || '请求失败，请稍后重试');
    return { data: null, error, response: error.response };
  }
}
