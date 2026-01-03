import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, TestUser } from './utils/auth';

let testUser: TestUser;

test.describe('Critical Path: Login → Dashboard → Practice', () => {
  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      await deleteTestUser(testUser.id);
    }
  });

  test('complete practice session flow', async ({ page }) => {
    // Step 1: Navigate to home page
    await page.goto('/');
    await expect(page.getByText(/SRS|Practice|Sign in/i)).toBeVisible();

    // Step 2: Sign in with test user
    await page.getByPlaceholder(/email/i).fill(testUser.email);
    await page.getByRole('button', { name: /sign in|submit|send/i }).click();

    // Step 3: Since we can't click Magic Link in tests, sign in programmatically
    await page.evaluate(async ({ email, password, supabaseUrl, supabaseKey }) => {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.auth.signInWithPassword({ email, password });
    }, {
      email: testUser.email,
      password: testUser.password,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    });

    // Reload to pick up the session
    await page.goto('/dashboard');

    // Step 4: Verify dashboard loads
    await expect(page.getByText(/dashboard|welcome|practice|due/i)).toBeVisible({ timeout: 10000 });

    // Step 5: Start practice session
    const practiceButton = page.getByRole('link', { name: /start practice|practice now/i })
      .or(page.getByRole('button', { name: /start practice|practice now/i }));

    if (await practiceButton.isVisible()) {
      await practiceButton.click();
      await expect(page).toHaveURL(/practice/);

      // Step 6: Verify exercise loads
      await expect(page.getByText(/python|exercise|prompt/i)).toBeVisible({ timeout: 10000 });

      // Step 7: Submit an answer (any text)
      const codeInput = page.locator('textarea').first();
      if (await codeInput.isVisible()) {
        await codeInput.fill('test answer');
        await page.keyboard.press('Enter');

        // Step 8: Verify feedback or next card
        await expect(
          page.getByText(/correct|incorrect|next|continue|summary/i)
        ).toBeVisible({ timeout: 5000 });
      }
    } else {
      // No cards due - this is also a valid state
      await expect(page.getByText(/caught up|no cards|mastered/i)).toBeVisible();
    }
  });
});
