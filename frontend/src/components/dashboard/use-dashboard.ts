import { onMounted, ref, shallowRef } from 'vue';
import { request } from '@/service/request';

export type DashboardData = import('@/service/api/openapi').components['schemas']['Dashboard'];

export function useDashboard() {
  const data = ref<DashboardData | null>(null);
  const loading = shallowRef(false);
  const failed = shallowRef(false);
  async function refresh() {
    loading.value = true;
    try {
      const result = await request<DashboardData>({ url: '/dashboard' });
      failed.value = Boolean(result.error);
      data.value = result.error ? null : result.data;
    } finally {
      loading.value = false;
    }
  }
  onMounted(refresh);
  return { data, loading, failed, refresh };
}
