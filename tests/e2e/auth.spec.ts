import { test, expect, Page } from '@playwright/test';

const MAILPIT_URL = process.env.MAILPIT_URL || 'http://localhost:8025';

async function getMagicLink(page: Page, email: string): Promise<string> {
  const endTime = Date.now() + 15000;
  while (Date.now() < endTime) {
    const response = await page.request.get(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}&limit=1`
    );
    const data = await response.json();
    if (data.messages?.length > 0) {
      const msgResponse = await page.request.get(
        `${MAILPIT_URL}/api/v1/message/${data.messages[0].ID}`
      );
      const msgData = await msgResponse.json();
      const match = msgData.HTML?.match(/href="([^"]*callback[^"]*)"/i);
      if (match) return match[1];
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`No magic link email found for ${email}`);
}

test.describe('Authentication Flow', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test.describe('Full Auth Flow', () => {
    test('should send magic link email', async ({ page }) => {
      // 1. Request magic link
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');

      // 2. Click submit and wait for navigation
      await Promise.all([
        page.waitForURL('**/verify-request**', { timeout: 30000 }),
        page.click('button[type="submit"]'),
      ]);

      await expect(
        page.locator('text=Enviamos um link de acesso para o seu email.')
      ).toBeVisible();
    });

    test('complete login flow with magic link', async ({ page }) => {
      const email = `auth-complete-${Date.now()}@example.com`;

      // 1. Request magic link
      await page.goto('/login');
      await page.fill('input[type="email"]', email);

      await Promise.all([
        page.waitForURL('**/verify-request**', { timeout: 30000 }),
        page.click('button[type="submit"]'),
      ]);

      // 2. Get magic link from Mailpit (polling by recipient)
      const magicLink = await getMagicLink(page, email);

      // 3. Follow magic link — new users land on /onboarding, returning on /dashboard
      await page.goto(magicLink);
      await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30000 });
    });
  });

  test('protected routes redirect after login', async ({ page }) => {
    await page.goto('/dashboard?test=redirect');
    await expect(page).toHaveURL(/\/login.*callbackUrl/);
  });
});
