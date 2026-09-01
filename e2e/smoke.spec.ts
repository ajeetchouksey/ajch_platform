import { test, expect } from '@playwright/test';

// Minimal infra smoke test.
//
// Deferred (do NOT add yet): blog.spec.ts / quiz.spec.ts flows described in the
// Test Engineer contract rely on selectors like [data-testid="post-card"] that
// do not exist anywhere in src/ yet (verified via repo-wide search). Writing
// those tests now would either fabricate assertions against a UI contract that
// doesn't exist, or force brittle text/CSS selectors that break on the next
// markup change. Once Frontend Engineer adds stable data-testid hooks to the
// blog list, post cards, and quiz flow, TEST-MODULE-6 can be implemented for
// real against those selectors.
test.describe('smoke', () => {
  test('home page responds and mounts the React app', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();

    await page.waitForLoadState('networkidle');

    // #root is the mount point declared in index.html — non-empty means React
    // successfully rendered rather than crashing to a blank page.
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    await expect(root).not.toBeEmpty();

    await expect(page).toHaveTitle(/Aarya/);
  });
});
