import type { Router, RouteRecordRaw } from 'vue-router';

/** Keep public layout wrappers outside the replaceable authorization route set. */
export function createRouteRegistry(router: Pick<Router, 'addRoute'>) {
  let constantsInstalled = false;
  let removeAuthRoutes: (() => void)[] = [];

  function installConstants(routes: RouteRecordRaw[]) {
    if (constantsInstalled) return;
    routes.forEach(route => router.addRoute(route));
    constantsInstalled = true;
  }

  function clearAuthRoutes() {
    removeAuthRoutes.forEach(remove => remove());
    removeAuthRoutes = [];
  }

  function replaceAuthRoutes(routes: RouteRecordRaw[]) {
    clearAuthRoutes();
    removeAuthRoutes = routes.map(route => router.addRoute(route));
  }

  return { installConstants, replaceAuthRoutes, clearAuthRoutes };
}
