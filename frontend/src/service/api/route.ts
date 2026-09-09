import { request } from '../request';

export function fetchGetUserRoutes() {
  return request<Api.Route.UserRoute>({ url: '/navigation/routes' });
}
export async function fetchIsRouteExist(routeName: string) {
  return {
    data: [
      'home',
      'profile',
      'manage',
      'manage_user',
      'manage_role',
      'manage_permission',
      'manage_menu',
      'manage_audit',
      'manage_docs'
    ].includes(routeName)
  };
}
