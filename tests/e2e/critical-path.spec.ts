import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { createTestUser, deleteTestUser, TestUser } from './utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
    // Step 1: Navigate to home page and verify it loads
    await page.goto('/');

    // Wait for auth check to complete - look for either "Sign in" form or logged in state
    await expect(
      page.getByText(/Sign in with Magic Link/i)
        .or(page.getByText(/Logged in/i))
        .or(page.getByText(/Auth Status/i))
    ).toBeVisible({ timeout: 10000 });

    // Step 2: Sign in programmatically via Supabase client (Node.js side)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    if (signInError) {
      throw new Error(`Failed to sign in test user: ${signInError.message}`);
    }

    // Step 3: Inject the session into the browser's localStorage
    const session = signInData.session;
    await page.evaluate(({ url, session }) => {
      // Supabase stores session in localStorage with key pattern: sb-<project-ref>-auth-token
      const projectRef = new URL(url).hostname.split('.')[0];
      const storageKey = `sb-${projectRef}-auth-token`;
      localStorage.setItem(storageKey, JSON.stringify(session));
    }, { url: supabaseUrl, session });

    // Step 4: Navigate to dashboard (this will pick up the session)
    await page.goto('/dashboard');

    // Step 5: Verify dashboard loads - look for the Dashboard heading
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 15000 });

    // Step 6: Look for practice button/link or "no cards" state
    const practiceButton = page.getByRole('button', { name: /start practice/i })
      .or(page.getByRole('link', { name: /start practice/i }));
    const noCardsText = page.getByText(/no cards|all caught up|nothing to practice/i);

    // Wait for either state
    await expect(practiceButton.or(noCardsText)).toBeVisible({ timeout: 10000 });

    // If practice is available, test the flow
    if (await practiceButton.isVisible()) {
      await practiceButton.click();
      await expect(page).toHaveURL(/practice/);

      // Verify practice page loads - look for Submit button or no cards state
      const submitButton = page.getByRole('button', { name: /submit/i });
      const noCardsOnPractice = page.getByText(/no cards|all caught up/i);
      await expect(submitButton.or(noCardsOnPractice)).toBeVisible({ timeout: 10000 });

      // If there's an exercise (Submit button visible), try to interact with it
      if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Find the answer textarea
        const answerInput = page.getByPlaceholder(/type your answer/i);
        await answerInput.fill('print("Hello, World!")');
        await submitButton.click();

        // Verify feedback appears (correct/incorrect state) - look for Continue button
        await expect(
          page.getByRole('button', { name: /continue/i })
        ).toBeVisible({ timeout: 5000 });
      }
    }

    // Test passed - critical path works
  });
});
