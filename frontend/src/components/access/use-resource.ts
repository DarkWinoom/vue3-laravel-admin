import { computed, onMounted, ref, shallowRef } from 'vue';
import { request } from '@/service/request';
import { useAuthStore } from '@/store/modules/auth';
import type { Option, Page, RecordItem, Resource } from './types';

export function useResource(resource: Resource) {
  const auth = useAuthStore();
  const rows = ref<RecordItem[]>([]);
  const total = shallowRef(0);
  const page = shallowRef(1);
  const pageSize = shallowRef(20);
  const search = shallowRef('');
  const loading = shallowRef(false);
  const failed = shallowRef(false);
  const saving = shallowRef(false);
  const version = shallowRef(0);
  const editing = shallowRef<RecordItem | null>(null);
  const drawer = shallowRef(false);
  const roleOptions = ref<Option[]>([]);
  const permissionOptions = ref<Option[]>([]);
  const menuOptions = ref<Option[]>([]);
  const can = (action: string) => auth.userInfo.buttons.includes(resource + '.' + action);
  const canAssign = computed(
    () => auth.userInfo.buttons.includes('roles.update') && auth.userInfo.buttons.includes('roles.read')
  );
  let generation = 0;
  async function load() {
    const current = ++generation;
    loading.value = true;
    const result = await request<Page>({
      url: '/' + resource,
      params: { page: page.value, pageSize: pageSize.value, search: search.value || undefined }
    });
    if (current !== generation) return;
    loading.value = false;
    failed.value = Boolean(result.error);
    if (result.error) {
      rows.value = [];
      return;
    }
    rows.value = result.data.records;
    total.value = result.data.total;
    version.value = result.data.version;
  }
  async function options(kind: Resource, useName = false): Promise<Option[]> {
    const all: RecordItem[] = [];
    let current = 1;
    let count = 0;
    do {
      const { data, error } = await request<Page>({ url: '/' + kind, params: { page: current++, pageSize: 100 } });
      if (error) return [];
      all.push(...data.records);
      count = data.total;
    } while (all.length < count);
    return all
      .filter(row => kind !== 'menus' || row.component === 'group')
      .map(row => ({ label: row.title || row.name, value: useName ? row.name : row.id }));
  }
  async function open(row: RecordItem | null = null) {
    editing.value = row;
    if (resource === 'users' && canAssign.value) roleOptions.value = await options('roles');
    if ((resource === 'roles' || resource === 'menus') && auth.userInfo.buttons.includes('permissions.read')) {
      permissionOptions.value = await options('permissions', resource === 'menus');
    }
    if (resource === 'menus') menuOptions.value = (await options('menus')).filter(option => option.value !== row?.id);
    drawer.value = true;
  }
  async function save(data: Record<string, unknown>) {
    saving.value = true;
    try {
      const { error } = await request({
        url: '/' + resource + (editing.value ? '/' + editing.value.id : ''),
        method: editing.value ? 'put' : 'post',
        data: { ...data, version: version.value }
      });
      if (error) return;
      drawer.value = false;
      window.$message?.success('保存成功');
      await auth.refreshAccess();
      await load();
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
    if (rows.value.length === 1 && page.value > 1) page.value -= 1;
    await auth.refreshAccess();
    await load();
  }
  function searchNow() {
    page.value = 1;
    return load();
  }
  function changePage(value: number) {
    page.value = value;
    return load();
  }
  function changePageSize(value: number) {
    pageSize.value = value;
    return searchNow();
  }
  onMounted(load);
  return {
    rows,
    total,
    page,
    pageSize,
    search,
    loading,
    failed,
    saving,
    editing,
    drawer,
    roleOptions,
    permissionOptions,
    menuOptions,
    can,
    canAssign,
    load,
    open,
    save,
    remove,
    searchNow,
    changePage,
    changePageSize
  };
}
