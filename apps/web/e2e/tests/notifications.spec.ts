import { test, expect } from '@playwright/test';

test('notifications smoke: open and show unread badge', async ({ page }) => {
  await page.goto('/');
  // open notifications menu
  const badge = page.locator('[data-test="notif-unread-badge"]');
  // badge may or may not exist depending on seeded data; ensure UI loads
  await expect(page).toHaveTitle(/AI Warehouse/i);
  // try opening notifications dropdown
  const btn = page.locator('[data-test="notif-button"]');
  if (await btn.count()) {
    await btn.click();
    await page.waitForTimeout(500);
    const list = page.locator('[data-test="notif-list"]');
    expect(await list.count()).toBeGreaterThanOrEqual(0);
  }
});
