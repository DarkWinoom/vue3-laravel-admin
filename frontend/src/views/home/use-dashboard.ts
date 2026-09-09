import { onMounted, ref } from 'vue';
import { request } from '@/service/request';

export type DashboardData = import('@/service/api/openapi').components['schemas']['Dashboard'];

export function useDashboard() {
  const data = ref<DashboardData | null>(null);
  const loading = ref(false);
  const failed = ref(false);
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
