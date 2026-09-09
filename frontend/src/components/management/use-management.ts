import { computed, reactive, ref, shallowRef } from 'vue';
import { request } from '@/service/request';
import { useAuthStore } from '@/store/modules/auth';
import { useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { managementColumns } from './columns';
import type { Option, Page, RecordItem, Resource, SearchModel } from './types';

export function useManagement(resource: Resource) {
  const auth = useAuthStore();
  const filters = ref<SearchModel>({ search: '', name: '', email: '', enabled: null });
  const params = reactive({ page: 1, pageSize: 10 });
  const version = shallowRef(0);
  const failed = shallowRef(false);
  const saving = shallowRef(false);
  const roleOptions = ref<Option[]>([]);
  const permissionOptions = ref<Option[]>([]);
  const menuOptions = ref<Option[]>([]);
  const can = (action: string) => auth.userInfo.buttons.includes(resource + '.' + action);
  const canAssign = computed(
    () => auth.userInfo.buttons.includes('roles.update') && auth.userInfo.buttons.includes('roles.read')
  );
  const table = useNaivePaginatedTable({
    api: () =>
      request<Page>({
        url: '/' + resource,
        params: {
          ...Object.fromEntries(Object.entries(filters.value).filter(([, value]) => value !== '' && value !== null)),
          ...params
        }
      }),
    transform: result => {
      failed.value = Boolean(result.error);
      if (result.error) return { data: [] as RecordItem[], pageNum: 1, pageSize: params.pageSize, total: 0 };
      version.value = result.data.version;
      return {
        data: result.data.records,
        pageNum: result.data.page,
        pageSize: result.data.pageSize,
        total: result.data.total
      };
    },
    onPaginationParamsChange: value => {
      Object.assign(params, value);
    },
    columns: () => managementColumns(resource, can, open, remove)
  });
  const editingRows = computed(() => table.data.value.flatMap(row => [row, ...(row.children || [])]));
  const editor = useTableOperate(editingRows, 'id', table.getData);

  async function options(kind: Resource, useName = false): Promise<Option[]> {
    const all: RecordItem[] = [];
    let page = 1;
    let total = 0;
    do {
      const { data, error } = await request<Page>({ url: '/' + kind, params: { page: page++, pageSize: 100 } });
      if (error) return [];
      all.push(...data.records);
      total = data.total;
      if (!data.records.length) break;
    } while (all.length < total);
    return all
      .filter(row => kind !== 'menus' || row.component === 'group')
      .map(row => ({ label: row.title || row.name, value: useName ? row.name : row.id }));
  }
  async function open(row?: RecordItem) {
    if (resource === 'users' && canAssign.value) roleOptions.value = await options('roles');
    if ((resource === 'roles' || resource === 'menus') && auth.userInfo.buttons.includes('permissions.read'))
      permissionOptions.value = await options('permissions', resource === 'menus');
    if (resource === 'menus') menuOptions.value = (await options('menus')).filter(item => item.value !== row?.id);
    if (row) editor.handleEdit(row.id);
    else editor.handleAdd();
  }
  async function save(data: Record<string, unknown>) {
    saving.value = true;
    try {
      const id = editor.operateType.value === 'edit' ? editor.editingData.value?.id : null;
      const { error } = await request({
        url: '/' + resource + (id ? '/' + id : ''),
        method: id ? 'put' : 'post',
        data: { ...data, version: version.value }
      });
      if (error) return;
      editor.closeDrawer();
      window.$message?.success('保存成功');
      await auth.refreshAccess();
      await table.getData();
    } finally {
      saving.value = false;
    }
  }
  async function remove(row: RecordItem) {
    const { error } = await request({
      url: '/' + resource + '/' + row.id,
      method: 'delete',
      data: { version: version.value }
    });
    if (error) return;
    await auth.refreshAccess();
    await editor.onDeleted();
  }
  async function reset() {
    Object.assign(filters.value, { search: '', name: '', email: '', enabled: null });
    await table.getDataByPage(1);
  }
  return {
    ...table,
    ...editor,
    filters,
    failed,
    saving,
    can,
    canAssign,
    roleOptions,
    permissionOptions,
    menuOptions,
    open,
    save,
    remove,
    reset
  };
}
