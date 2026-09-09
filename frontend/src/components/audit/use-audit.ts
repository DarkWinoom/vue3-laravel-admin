import { h, reactive, ref, shallowRef } from 'vue';
import { NButton, NTag } from 'naive-ui';
import { request } from '@/service/request';
import { useNaivePaginatedTable } from '@/hooks/common/table';

export type AuditRow = import('@/service/api/openapi').components['schemas']['AuditRecord'];

export interface AuditFilters {
  actor: string;
  action: string;
  result: string | null;
  requestId: string;
  dateFrom: string | null;
  dateTo: string | null;
}

export function useAudit() {
  const filters = ref<AuditFilters>({
    actor: '',
    action: '',
    result: null as string | null,
    requestId: '',
    dateFrom: null as string | null,
    dateTo: null as string | null
  });
  const params = reactive({ page: 1, pageSize: 10 });
  const failed = shallowRef(false);
  const selected = ref<AuditRow | null>(null);
  const table = useNaivePaginatedTable({
    api: () =>
      request<import('@/service/api/openapi').components['schemas']['AuditPage']>({
        url: '/audit-logs',
        params: {
          ...params,
          ...Object.fromEntries(Object.entries(filters.value).filter(([, value]) => value !== '' && value !== null))
        }
      }),
    transform: result => {
      failed.value = Boolean(result.error);
      if (result.error) return { data: [] as AuditRow[], total: 0, pageNum: params.page, pageSize: params.pageSize };
      return {
        data: result.data.records,
        total: result.data.total,
        pageNum: result.data.page,
        pageSize: result.data.pageSize
      };
    },
    onPaginationParamsChange: value => {
      Object.assign(params, value);
    },
    columns: () => [
      { key: 'id', title: '编号', width: 85 },
      { key: 'actor_name', title: '操作人', width: 140, render: row => row.actor_name || '系统 / 未登录' },
      { key: 'action', title: '操作', minWidth: 230 },
      { key: 'target_id', title: '对象编号', width: 100, render: row => row.target_id || '—' },
      {
        key: 'result',
        title: '结果',
        width: 90,
        render: row =>
          h(NTag, { type: row.result === 'success' ? 'success' : 'error', bordered: false }, () =>
            row.result === 'success' ? '成功' : '失败'
          )
      },
      { key: 'occurred_at', title: '时间（UTC）', width: 190 },
      {
        key: 'operate',
        title: '操作',
        width: 90,
        fixed: 'right',
        render: row =>
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              ghost: true,
              onClick: () => {
                selected.value = row;
              }
            },
            () => '详情'
          )
      }
    ]
  });
  async function reset() {
    Object.assign(filters.value, { actor: '', action: '', result: null, requestId: '', dateFrom: null, dateTo: null });
    await table.getDataByPage(1);
  }
  return { ...table, filters, failed, selected, reset };
}
