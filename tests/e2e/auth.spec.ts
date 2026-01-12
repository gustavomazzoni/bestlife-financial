import { test, expect } from '@playwright/test';

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

  test('should send magic link email', async ({ page }) => {
    // 1. Request magic link
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    // 2. Should be redirected to verify-request
    await page.waitForURL('/verify-request');
    await expect(
      page.locator('text=Enviamos um link de acesso para o seu email.')
    ).toBeVisible();
  });

  test('complete login flow with magic link', async ({ page }) => {
    // 1. Request magic link
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    // 2. Get magic link from Mailpit API
    const mailpitResponse = await page.request.get(
      'http://mailpit:8025/api/v1/messages'
    );
    const messages = await mailpitResponse.json();
    const latestMessage = messages.messages[0];

    // 3. Extract link from email
    const messageResponse = await page.request.get(
      `http://mailpit:8025/api/v1/message/${latestMessage.ID}`
    );
    const messageData = await messageResponse.json();
    const emailHtml = messageData.HTML;
    const magicLinkMatch = emailHtml.match(/href="([^"]*callback[^"]*)"/i);
    const magicLink = magicLinkMatch ? magicLinkMatch[1] : null;

    expect(magicLink).toBeTruthy();

    // 4. Click magic link
    await page.goto(magicLink!);

    // 5. Should be redirected to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('text=test@example.com')).toBeVisible();
  });

  test('logout flow', async ({ page }) => {
    // Assume user is logged in (setup with beforeEach if needed)
    await page.goto('/dashboard');

    await page.click('button:has-text("Sair")');

    await expect(page).toHaveURL('/login');
  });

  test('protected routes redirect after login', async ({ page }) => {
    await page.goto('/dashboard?test=redirect');
    await expect(page).toHaveURL(/\/login.*callbackUrl/);

    // After auth, should return to intended page
    // (Would need full login flow here)
  });
});
