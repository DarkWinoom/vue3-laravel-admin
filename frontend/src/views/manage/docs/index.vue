<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import SwaggerUI from 'swagger-ui-dist/swagger-ui-bundle.js';
import 'swagger-ui-dist/swagger-ui.css';
import { request } from '@/service/request';
import { csrfToken, sessionState } from '@/service/request/session';
import { getServiceBaseURL } from '@/utils/service';

const container = ref<HTMLElement | null>(null);
const loading = ref(false);
const failed = ref(false);
let disposed = false;
const { baseURL } = getServiceBaseURL(import.meta.env, import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y');
const api = new URL(baseURL.replace(/\/$/, '') + '/api', window.location.origin);

async function load() {
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
</script>

<template>
  <NCard title="API 文档" :bordered="false" class="card-wrapper docs-page">
    <template #header-extra>
      <NButton :loading="loading" @click="load">
        <template #icon><icon-ic-round-refresh /></template>
        刷新文档
      </NButton>
    </template>
    <NAlert type="info" :show-icon="false" class="mb-16px">
      调试请求使用当前登录身份和实时权限。写入接口会修改实际数据；管理接口的 version 请从最新列表中获取。
    </NAlert>
    <NAlert v-if="failed" type="error" class="mb-16px">文档暂不可用，请确认文档开关、查看权限或点击刷新重试。</NAlert>
    <NSkeleton v-if="loading" height="180px" />
    <div v-show="!loading && !failed" ref="container" class="docs-content" />
  </NCard>
</template>

<style scoped lang="scss">
.docs-page {
  min-height: 100%;

  :deep(.swagger-ui) {
    color: rgb(var(--base-text-color));
    font-family: inherit;

    .wrapper {
      padding: 0;
    }
    .info {
      margin: 20px 0;
    }
    .info .title {
      font-size: 24px;
    }
    .info .title small {
      background: #626874;
    }
    .opblock .opblock-summary-path {
      font-size: 16px;
    }
    .opblock-tag {
      font-size: 18px;
    }
    .opblock-summary {
      flex-wrap: wrap;
      gap: 6px;
    }
    .opblock-summary-description {
      min-width: 140px;
    }
    .opblock-description-wrapper,
    .opblock-external-docs-wrapper,
    .opblock-title_normal {
      padding: 12px;
    }
    .opblock-body {
      overflow-x: auto;
    }
    table {
      min-width: 460px;
    }
    .info p,
    .info li,
    .info hgroup,
    .info .title,
    .opblock-tag,
    .opblock-summary-description,
    .opblock-summary-path,
    .opblock-section-header h4,
    .opblock-description-wrapper p,
    .parameter__name,
    .parameter__type,
    .parameter__in,
    .response-col_status,
    .response-col_description,
    .responses-inner h4,
    .responses-inner h5,
    table thead tr th,
    table thead tr td,
    label,
    .btn,
    .model-title,
    .model {
      color: inherit;
    }
    .opblock-section-header,
    .scheme-container {
      background: rgb(var(--base-text-color) / 0.04);
    }
    input,
    textarea,
    select {
      color: rgb(var(--base-text-color));
      background: rgb(var(--container-bg-color));
    }
    .btn {
      border-color: currentColor;
    }
    h4,
    h5,
    h6,
    p,
    small,
    code,
    pre,
    label,
    input,
    textarea,
    select,
    button,
    th,
    td,
    span,
    div {
      font-size: max(14px, 1em);
    }
  }
}
</style>
