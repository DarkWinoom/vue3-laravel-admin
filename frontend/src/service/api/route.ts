import type { RouteKey } from '@elegant-router/types';
import { getRoutePath } from '@/router/elegant/transform';
import { request } from '../request';

export function fetchGetUserRoutes() {
  return request<Api.Route.UserRoute>({ url: '/navigation/routes' });
}
export async function fetchIsRouteExist(routeName: RouteKey) {
  return { data: Boolean(getRoutePath(routeName)) };
}
