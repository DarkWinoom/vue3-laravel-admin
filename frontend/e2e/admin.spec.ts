import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: '请输入邮箱', exact: true }).fill(email);
  await page.getByRole('textbox', { name: '请输入密码', exact: true }).fill('Browser-test-password!');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page.getByRole('heading', { name: /欢迎/ })).toBeVisible();
}
test('administrator sees real statistics, audit filters and local API documentation', async ({ page }) => {
  await login(page, 'browser-admin@example.test');
  await expect(page.getByRole('heading', { name: '权限总数', exact: true })).toBeVisible();
  await page.getByRole('menuitem', { name: '系统管理', exact: true }).click();
  await page.getByRole('menuitem', { name: '操作审计', exact: true }).click();
  await page.getByText('搜索', { exact: true }).click();
  await page.getByRole('textbox', { name: '如 user.created', exact: true }).fill('auth.login');
  await page.getByRole('button', { name: '搜索', exact: true }).click();
  await page.getByRole('button', { name: '详情', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText('web');
  await page.getByRole('button', { name: 'close', exact: true }).click();
  await page.getByRole('menuitem', { name: 'API 文档', exact: true }).click();
  await expect(page.getByRole('heading', { name: /OAS 3.1/ })).toBeVisible();
  const small = await page
    .locator('main')
    .first()
    .evaluate(root =>
      Array.from(root.querySelectorAll('*'))
        .filter(
          el =>
            Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent?.trim()) &&
            el.getClientRects().length &&
            Number.parseFloat(getComputedStyle(el).fontSize) < 14
        )
        .map(el => el.textContent?.slice(0, 40))
    );
  expect(small).toEqual([]);
});
test('viewer cannot see write actions or directly open privileged routes', async ({ page }) => {
  await login(page, 'browser-viewer@example.test');
  await expect(page.getByRole('heading', { name: '权限总数', exact: true })).toHaveCount(0);
  await page.getByRole('menuitem', { name: '系统管理', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: '操作审计', exact: true })).toHaveCount(0);
  await page.getByRole('menuitem', { name: '用户管理', exact: true }).click();
  await expect(page.getByRole('button', { name: '新增', exact: true })).toHaveCount(0);
  await page.goto('/manage/audit');
  await expect(page).toHaveURL(/\/403$/);
  await page.getByRole('button', { name: '返回首页', exact: true }).click();
  await expect(page.getByRole('heading', { name: /欢迎/ })).toBeVisible();
});
test('user create edit and delete uses the real API and optimistic version', async ({ page }) => {
  await login(page, 'browser-admin@example.test');
  await page.getByRole('menuitem', { name: '系统管理', exact: true }).click();
  await page.getByRole('menuitem', { name: '用户管理', exact: true }).click();
  await page.getByRole('button', { name: '新增', exact: true }).click();
  const drawer = page.getByRole('dialog');
  await drawer.getByPlaceholder('请输入用户名', { exact: true }).fill('E2E User');
  await drawer.getByPlaceholder('请输入邮箱', { exact: true }).fill('e2e-user@example.test');
  await drawer.getByPlaceholder('请输入至少 12 位密码', { exact: true }).fill('E2E-test-password!');
  await drawer.getByRole('button', { name: '确定', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: 'e2e-user@example.test' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: '编辑', exact: true }).click();
  await drawer.getByPlaceholder('请输入用户名', { exact: true }).fill('E2E Updated');
  await drawer.getByRole('button', { name: '确定', exact: true }).click();
  await expect(row).toContainText('E2E Updated');
  await row.getByRole('button', { name: '删除', exact: true }).click();
  await page.getByRole('button', { name: '确认', exact: true }).click();
  await expect(row).toHaveCount(0);
});
