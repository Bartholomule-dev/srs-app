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

    // Wait for landing page to load - look for hero heading
    await expect(
      page.getByRole('heading', { name: /Keep Your Code Skills Sharp/i })
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

    // Step 3: Inject the session into browser cookies (@supabase/ssr uses cookies, not localStorage)
    const session = signInData.session;
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
    const cookieName = `sb-${projectRef}-auth-token`;

    // Set the session cookie - Supabase SSR stores the full session object as JSON
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

    // Step 4: Navigate to dashboard (this will pick up the session)
    await page.goto('/dashboard');

    // Step 5: Verify dashboard loads - look for greeting heading
    await expect(
      page.getByRole('heading', { name: /Good (morning|afternoon|evening|night)/i })
    ).toBeVisible({ timeout: 15000 });

    // Step 6: Look for practice button/link - could be "Learn new cards", "Start Practice", or "Browse exercises"
    const practiceButton = page.getByRole('link', { name: /learn new cards|start practice|browse exercises/i });

    // Wait for practice button to be visible - it should always be present
    await expect(practiceButton).toBeVisible({ timeout: 10000 });

    // Click practice button and verify navigation
    {
      await practiceButton.click();
      await expect(page).toHaveURL(/practice/);

      // Verify practice page loads - look for Submit button or no cards state
      const submitButton = page.getByRole('button', { name: /submit/i });
      const noCardsOnPractice = page.getByText(/no cards to practice/i);

      // Wait for either submit button or no cards message
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
