import { nextTick, onBeforeUnmount, onMounted, shallowRef } from 'vue';
import SwaggerUI from 'swagger-ui-dist/swagger-ui-bundle.js';
import 'swagger-ui-dist/swagger-ui.css';
import { request } from '@/service/request';
import { csrfToken, sessionState } from '@/service/request/session';
import { getServiceBaseURL } from '@/utils/service';

export function useApiDocumentation() {
  const container = shallowRef<HTMLElement | null>(null);
  const loading = shallowRef(false);
  const failed = shallowRef(false);
  let disposed = false;
  const { baseURL } = getServiceBaseURL(
    import.meta.env,
    import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y'
  );
  const api = new URL(baseURL.replace(/\/$/, '') + '/api', window.location.origin);

  async function load() {
    if (loading.value) return;
    loading.value = true;
    failed.value = false;
    try {
      const result = await request<Record<string, unknown>>({ url: '/openapi' });
      if (disposed) return;
      failed.value = Boolean(result.error);
      if (result.error) return;
      await nextTick();
      SwaggerUI({
        domNode: container.value,
        spec: { ...result.data, servers: [{ url: api.href }] },
        layout: 'BaseLayout',
        deepLinking: false,
        validatorUrl: null,
        persistAuthorization: false,
        withCredentials: true,
        docExpansion: 'none',
        defaultModelsExpandDepth: -1,
        requestInterceptor: async req => {
          const target = new URL(req.url, window.location.origin);
          if (target.origin !== api.origin || !target.pathname.startsWith(api.pathname + '/v1/'))
            throw new Error('仅支持当前系统 API');
          if (!['/auth/login', '/auth/refresh', '/health'].some(path => target.pathname.endsWith(path))) {
            const identity = await request({ url: '/auth/me' });
            if (identity.error) throw identity.error;
            req.headers.Authorization = 'Bearer ' + sessionState.token;
          }
          req.headers['X-CSRF-Token'] = csrfToken();
          return req;
        }
      });
    } catch {
      failed.value = true;
    } finally {
      loading.value = false;
    }
  }
  onMounted(load);
  onBeforeUnmount(() => {
    disposed = true;
  });

  return { container, loading, failed, load };
}
