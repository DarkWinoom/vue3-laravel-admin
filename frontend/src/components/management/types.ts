export type Resource = 'users' | 'roles' | 'permissions' | 'menus';
export interface RecordItem {
  children?: RecordItem[];
  id: number;
  name: string;
  email?: string;
  enabled?: boolean | number;
  roleIds?: number[];
  roleNames?: string[];
  permissionIds?: number[];
  title?: string;
  path?: string;
  component?: string;
  parent_id?: number | null;
  permission?: string | null;
  icon?: string;
  sort?: number;
}
export interface Page {
  records: RecordItem[];
  total: number;
  page: number;
  pageSize: number;
  version: number;
}
export type Option = { label: string; value: string | number };
export const titles: Record<Resource, string> = {
  users: '用户管理',
  roles: '角色管理',
  permissions: '权限管理',
  menus: '菜单管理'
};
export const nouns: Record<Resource, string> = { users: '用户', roles: '角色', permissions: '权限', menus: '菜单' };
export interface SearchModel {
  search: string;
  name: string;
  email: string;
  enabled: number | null;
}
