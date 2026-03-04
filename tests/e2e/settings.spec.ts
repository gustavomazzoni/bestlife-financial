import { test, expect, Page } from '@playwright/test';

const MAILPIT_URL = process.env.MAILPIT_URL || 'http://localhost:8025';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
}

async function getMagicLink(page: Page, email: string): Promise<string> {
  const endTime = Date.now() + 15000;
  while (Date.now() < endTime) {
    const res = await page.request.get(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}&limit=1`
    );
    const data = await res.json();
    if (data.messages?.length > 0) {
      const msg = await page.request.get(
        `${MAILPIT_URL}/api/v1/message/${data.messages[0].ID}`
      );
      const msgData = await msg.json();
      const match = msgData.HTML?.match(/href="([^"]*callback[^"]*)"/i);
      if (match) return match[1];
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`No magic link email found for ${email}`);
}

async function loginUser(
  page: Page,
  email: string,
  opts: { income?: string; dreamCost?: string; investments?: string } = {}
) {
  const { income = '8000', dreamCost = '15000', investments = '50000' } = opts;

  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await Promise.all([
    page.waitForURL('**/verify-request**', { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
  const magicLink = await getMagicLink(page, email);
  await page.goto(magicLink);
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30000 });

  if (page.url().includes('/onboarding')) {
    await page.fill('#step-input', income);
    await page.click('button:has-text("Próximo")');
    await page.fill('#step-input', dreamCost);
    await page.click('button:has-text("Próximo")');
    await page.fill('#step-input', investments);
    await page.click('button:has-text("Concluir")');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
  }
}

test.describe('Settings', () => {
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);
  });

  test.describe('Navigation', () => {
    let email: string;

    test.beforeEach(async ({ page }) => {
      email = uniqueEmail('settings-nav');
      await loginUser(page, email);
    });

    test('bottom nav links navigate to the correct pages', async ({ page }) => {
      await page.goto('/dashboard');

      await page.getByTestId('nav-transactions').click();
      await expect(page).toHaveURL(/\/transactions/);

      await page.getByTestId('nav-calendar').click();
      await expect(page).toHaveURL(/\/calendar/);

      await page.getByTestId('nav-settings').click();
      await expect(page).toHaveURL(/\/settings/);

      await page.getByTestId('nav-dashboard').click();
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('settings hub shows profile link', async ({ page }) => {
      await page.goto('/settings');
      await expect(page.getByTestId('settings-link-profile')).toBeVisible();
    });

    test('header back button navigates from settings/profile to /settings', async ({
      page,
    }) => {
      await page.goto('/settings/profile');
      await expect(page.getByTestId('header-back')).toBeVisible();
      await page.getByTestId('header-back').click();
      await expect(page).toHaveURL(/\/settings/);
    });
  });

  test.describe('Profile update', () => {
    let email: string;

    test.beforeEach(async ({ page }) => {
      email = uniqueEmail('settings-profile');
      await loginUser(page, email, {
        income: '6000',
        dreamCost: '10000',
        investments: '30000',
      });
    });

    test('settings/profile page pre-fills fields with current profile values', async ({
      page,
    }) => {
      await page.goto('/settings/profile');

      await expect(page.getByTestId('settings-income-input')).toHaveValue(
        '6000'
      );
      await expect(page.getByTestId('settings-dream-cost-input')).toHaveValue(
        '10000'
      );
      await expect(page.getByTestId('settings-investments-input')).toHaveValue(
        '30000'
      );
    });

    test('updating dream lifestyle cost reflects on dashboard FI Progress', async ({
      page,
    }) => {
      await page.goto('/settings/profile');

      await page.getByTestId('settings-dream-cost-input').clear();
      await page.getByTestId('settings-dream-cost-input').fill('20000');
      await page.getByTestId('settings-profile-submit').click();

      // Should redirect to /settings after save
      await expect(page).toHaveURL(/\/settings/, { timeout: 10000 });

      // Dashboard FI progress metric should be visible
      await page.goto('/dashboard');
      await expect(page.getByTestId('metric-fi-progress')).toBeVisible();
    });

    test('updating monthly income reflects on dashboard savings rate', async ({
      page,
    }) => {
      await page.goto('/settings/profile');

      await page.getByTestId('settings-income-input').clear();
      await page.getByTestId('settings-income-input').fill('10000');
      await page.getByTestId('settings-profile-submit').click();

      await expect(page).toHaveURL(/\/settings/, { timeout: 10000 });

      await page.goto('/dashboard');
      await expect(page.getByTestId('metric-savings-rate')).toBeVisible();
    });

    test('shows validation error when dream cost is zero', async ({ page }) => {
      await page.goto('/settings/profile');

      await page.getByTestId('settings-dream-cost-input').clear();
      await page.getByTestId('settings-dream-cost-input').fill('0');
      await page.getByTestId('settings-profile-submit').click();

      // Should not navigate away
      await expect(page).toHaveURL(/\/settings\/profile/);
    });
  });

  test.describe('Logout', () => {
    test('logout button signs out and redirects to /login', async ({
      page,
    }) => {
      const email = uniqueEmail('settings-logout');
      await loginUser(page, email);

      await page.goto('/dashboard');
      await page.getByTestId('header-logout').click();
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });
  });
});
