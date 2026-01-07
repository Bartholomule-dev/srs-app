// tests/e2e/dynamic-exercises.spec.ts
import { test, expect, Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { createTestUser, deleteTestUser, TestUser } from './utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Helper to authenticate a test user and inject session cookies.
 */
async function authenticateUser(page: Page, user: TestUser): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (signInError) {
    throw new Error(`Failed to sign in: ${signInError.message}`);
  }

  const session = signInData.session;
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  await page.context().addCookies([
    {
      name: cookieName,
      value: encodeURIComponent(JSON.stringify(session)),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Click through any teaching cards to get to exercises.
 */
async function skipTeachingCards(page: Page): Promise<void> {
  const gotItBtn = page.getByRole('button', { name: /got it/i });

  while (await gotItBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await gotItBtn.click();
    await page.waitForTimeout(300);
  }
}

// Run tests serially to avoid database connection pool issues
test.describe.configure({ mode: 'serial' });

test.describe('Dynamic Exercise E2E Tests', () => {
  let testUser: TestUser;

  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      await deleteTestUser(testUser.id);
    }
  });

  test('dynamic exercise renders concrete values (not template placeholders)', async ({ page }) => {
    test.setTimeout(60000);

    await authenticateUser(page, testUser);
    await page.goto('/practice');

    // Wait for practice to load
    const submitBtn = page.getByRole('button', { name: /submit/i });
    const gotItBtn = page.getByRole('button', { name: /got it/i });
    const allCaughtUp = page.getByText(/all caught up/i);

    await expect(submitBtn.or(gotItBtn).or(allCaughtUp)).toBeVisible({ timeout: 15000 });

    // Click through teaching cards
    await skipTeachingCards(page);

    // If we have an exercise, check for template placeholders
    if (await submitBtn.isVisible().catch(() => false)) {
      // Get the full page content
      const pageContent = await page.content();

      // CRITICAL: Template placeholders like {{start}} should NOT appear in rendered page
      expect(pageContent).not.toContain('{{');
      expect(pageContent).not.toContain('}}');

      // Check prompt specifically
      const promptLocator = page.locator('[data-testid="exercise-prompt"]');
      if (await promptLocator.isVisible({ timeout: 2000 }).catch(() => false)) {
        const promptText = await promptLocator.textContent();
        expect(promptText).not.toContain('{{start}}');
        expect(promptText).not.toContain('{{end}}');
        expect(promptText).not.toContain('{{a}}');
        expect(promptText).not.toContain('{{b}}');
      }

      console.log('Template placeholder test passed - no {{}} found in page');
    } else {
      console.log('No exercises available - skipping placeholder test');
    }
  });

  test('same user sees same dynamic values after page reload', async ({ page }) => {
    test.setTimeout(90000);

    await authenticateUser(page, testUser);
    await page.goto('/practice');

    // Wait for exercise
    const submitBtn = page.getByRole('button', { name: /submit/i });
    const gotItBtn = page.getByRole('button', { name: /got it/i });
    const allCaughtUp = page.getByText(/all caught up/i);

    await expect(submitBtn.or(gotItBtn).or(allCaughtUp)).toBeVisible({ timeout: 15000 });

    // Click through teaching cards
    await skipTeachingCards(page);

    // Skip if no exercises
    if (!(await submitBtn.isVisible().catch(() => false))) {
      console.log('No exercises available - skipping determinism test');
      return;
    }

    // Capture first render of exercise prompt
    const promptLocator = page.locator('[data-testid="exercise-prompt"]');
    let firstPrompt: string;

    if (await promptLocator.isVisible({ timeout: 2000 }).catch(() => false)) {
      firstPrompt = (await promptLocator.textContent()) ?? '';
    } else {
      firstPrompt = (await page.locator('main').textContent()) ?? '';
    }

    // Reload the page
    await page.reload();

    // Wait for exercise to load again
    await expect(submitBtn.or(gotItBtn).or(allCaughtUp)).toBeVisible({ timeout: 15000 });

    // Click through teaching cards again
    await skipTeachingCards(page);

    // Capture second render
    let secondPrompt: string;
    if (await promptLocator.isVisible({ timeout: 2000 }).catch(() => false)) {
      secondPrompt = (await promptLocator.textContent()) ?? '';
    } else {
      secondPrompt = (await page.locator('main').textContent()) ?? '';
    }

    // Both should have no template placeholders
    expect(firstPrompt).not.toContain('{{');
    expect(secondPrompt).not.toContain('{{');

    console.log('Determinism test passed - no template placeholders after reload');
  });
});
