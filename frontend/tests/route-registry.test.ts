import assert from 'node:assert/strict';
import test from 'node:test';
import { createMemoryHistory, createRouter } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { createRouteRegistry } from '../src/store/modules/route/registry.ts';

test('public single-page layout wrappers survive repeated authorization replacement and logout', async () => {
  const router = createRouter({ history: createMemoryHistory(), routes: [] });
  const registry = createRouteRegistry(router);
  // Elegant Router puts constant metadata on the child, not on the anonymous layout wrapper.
  const constants: RouteRecordRaw[] = ['login', '403'].map(name => ({
    path: '/' + name,
    component: {},
    meta: { title: name },
    children: [{ path: '', name, component: {}, meta: { title: name, constant: true } }]
  }));
  registry.installConstants(constants);
  const initialCount = router.getRoutes().length;
  for (let i = 0; i < 3; i++) {
    registry.installConstants(constants);
    registry.replaceAuthRoutes([
      {
        name: 'manage',
        path: '/manage',
        component: {},
        children: [{ name: 'manage_user', path: 'user', component: {} }]
      }
    ]);
    await router.push('/manage/user');
    assert.equal(router.currentRoute.value.name, 'manage_user');
    registry.clearAuthRoutes();
    assert.equal(router.hasRoute('manage_user'), false);
    assert.equal(router.hasRoute('manage'), false);
    await router.push({ name: '403' });
    assert.equal(router.currentRoute.value.name, '403');
    await router.push({ name: 'login' });
    assert.equal(router.currentRoute.value.name, 'login');
    assert.equal(router.getRoutes().length, initialCount);
  }
});
