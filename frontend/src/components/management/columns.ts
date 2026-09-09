import { h } from 'vue';
import { NButton, NPopconfirm, NTag } from 'naive-ui';

import SvgIcon from '@/components/custom/svg-icon.vue';
import type { RecordItem, Resource } from './types';

export function managementColumns(
  resource: Resource,
  can: (action: string) => boolean,
  edit: (row: RecordItem) => void,
  remove: (row: RecordItem) => void
): NaiveUI.TableColumn<RecordItem>[] {
  const columns: NaiveUI.TableColumn<RecordItem>[] = [
    resource === 'menus'
      ? { key: 'id', title: 'ID', align: 'center', width: 64 }
      : { key: 'index', title: '序号', align: 'center', width: 64, render: (_row, index) => index + 1 },
    {
      key: 'name',
      title:
        resource === 'users'
          ? '用户名'
          : resource === 'menus'
            ? '路由名称'
            : resource === 'roles'
              ? '角色名称'
              : '权限标识',
      align: 'center',
      minWidth: 140
    }
  ];
  if (resource === 'users') {
    columns.push(
      { key: 'email', title: '邮箱', align: 'center', minWidth: 220 },
      {
        key: 'roleNames',
        title: '角色',
        align: 'center',
        minWidth: 160,
        render: row =>
          h(
            'div',
            { class: 'flex-center flex-wrap gap-4px' },
            (row.roleNames || []).map(name =>
              h(
                NTag,
                { size: 'small', type: 'primary', bordered: false },
                { default: () => (name === 'admin' ? '管理员' : name) }
              )
            )
          )
      }
    );
  }
  if (resource === 'roles')
    columns.push({
      key: 'permissionIds',
      title: '已分配权限',
      align: 'center',
      minWidth: 140,
      render: row =>
        h(NTag, { size: 'small', type: 'primary' }, { default: () => String(row.permissionIds?.length ?? 0) + ' 项' })
    });
  if (resource === 'menus') {
    columns.splice(
      1,
      0,
      { key: 'title', title: '菜单名称', align: 'center', minWidth: 140 },
      {
        key: 'icon',
        title: '图标',
        align: 'center',
        width: 64,
        render: row => h('div', { class: 'flex-center' }, h(SvgIcon, { icon: row.icon, class: 'text-icon' }))
      },
      {
        key: 'component',
        title: '菜单类型',
        align: 'center',
        width: 100,
        render: row =>
          h(
            NTag,
            { type: row.component === 'group' ? 'default' : 'primary', size: 'small' },
            { default: () => (row.component === 'group' ? '目录' : '菜单') }
          )
      }
    );
    columns.push(
      { key: 'path', title: '路由路径', align: 'center', minWidth: 180 },
      { key: 'permission', title: '权限标识', align: 'center', minWidth: 150 },
      { key: 'sort', title: '排序', align: 'center', width: 64 }
    );
  }
  if (resource === 'users' || resource === 'menus')
    columns.push({
      key: 'enabled',
      title: '状态',
      align: 'center',
      width: 100,
      render: row =>
        h(
          NTag,
          { type: row.enabled ? 'success' : 'warning', size: 'small' },
          { default: () => (row.enabled ? '启用' : '禁用') }
        )
    });
  if (can('update') || can('delete'))
    columns.push({
      key: 'operate',
      title: '操作',
      align: 'center',
      width: 150,
      fixed: 'right',
      render: row =>
        h('div', { class: 'flex-center gap-8px' }, [
          can('update')
            ? h(
                NButton,
                { type: 'primary', ghost: true, size: 'small', onClick: () => edit(row) },
                { default: () => '编辑' }
              )
            : null,
          can('delete')
            ? h(
                NPopconfirm,
                { onPositiveClick: () => remove(row) },
                {
                  default: () => '确认删除吗？',
                  trigger: () => h(NButton, { type: 'error', ghost: true, size: 'small' }, { default: () => '删除' })
                }
              )
            : null
        ])
    });
  return columns;
}
