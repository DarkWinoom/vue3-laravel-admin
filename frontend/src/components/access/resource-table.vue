<script setup lang="ts">
import { computed, h } from 'vue';
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import type { RecordItem, Resource } from './types';

const props = defineProps<{
  resource: Resource;
  rows: RecordItem[];
  loading: boolean;
  edit: boolean;
  remove: boolean;
}>();
const emit = defineEmits<{ edit: [row: RecordItem]; remove: [row: RecordItem] }>();
const columns = computed<DataTableColumns<RecordItem>>(() => {
  const result: DataTableColumns<RecordItem> = [
    { title: 'ID', key: 'id', width: 70 },
    { title: props.resource === 'menus' ? '路由名称' : '名称', key: 'name', minWidth: 160 }
  ];
  if (props.resource === 'users') result.push({ title: '邮箱', key: 'email', minWidth: 210 });
  if (props.resource === 'menus')
    result.push(
      { title: '标题', key: 'title', minWidth: 130 },
      { title: '路径', key: 'path', minWidth: 160 },
      { title: '权限标识', key: 'permission', minWidth: 160 }
    );
  if (props.resource === 'users' || props.resource === 'menus') {
    result.push({
      title: '状态',
      key: 'enabled',
      width: 100,
      render: row =>
        h(NTag, { type: row.enabled ? 'success' : 'default' }, { default: () => (row.enabled ? '启用' : '禁用') })
    });
  }
  result.push({
    title: '操作',
    key: 'actions',
    width: 180,
    render: row =>
      h(
        NSpace,
        {},
        {
          default: () => [
            props.edit
              ? h(NButton, { size: 'small', onClick: () => emit('edit', row) }, { default: () => '编辑' })
              : null,
            props.remove
              ? h(
                  NPopconfirm,
                  { onPositiveClick: () => emit('remove', row) },
                  {
                    trigger: () =>
                      h(NButton, { size: 'small', type: 'error', secondary: true }, { default: () => '删除' }),
                    default: () => '确认删除此记录？'
                  }
                )
              : null
          ]
        }
      )
  });
  return result;
});
</script>

<template>
  <NDataTable
    :columns="columns"
    :data="rows"
    :loading="loading"
    :row-key="(row: RecordItem) => row.id"
    :scroll-x="900"
  />
</template>
