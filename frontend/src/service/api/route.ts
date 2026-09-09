import { createStaticRoutes } from '@/router/routes';
import { request } from '../request';

export async function fetchGetConstantRoutes() {
  return { data: createStaticRoutes().constantRoutes, error: null };
}
export function fetchGetUserRoutes() {
  return request<Api.Route.UserRoute>({ url: '/navigation/routes' });
}
export async function fetchIsRouteExist(routeName: string) {
  return { data: ['home', 'profile', 'users', 'roles', 'permissions', 'menus'].includes(routeName) };
}
