import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, authenticateUser, TestUser } from './utils/auth';

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
      page.getByRole('heading', { name: /Keep Your Code Sharp/i })
    ).toBeVisible({ timeout: 10000 });

    // Step 2: Sign in and inject session cookie
    await authenticateUser(page, testUser);

    // Step 3: Navigate to dashboard (this will pick up the session)
    await page.goto('/dashboard');

    // Step 4: Verify dashboard loads - look for greeting heading
    await expect(
      page.getByRole('heading', { name: /Good (morning|afternoon|evening|night)/i })
    ).toBeVisible({ timeout: 15000 });

    // Step 5: Look for practice button/link - could be "Learn new cards", "Start Practice", or "Browse exercises"
    // It could be either a button or a link depending on the component
    const practiceLink = page.getByRole('link', { name: /learn new cards|start practice|browse exercises/i });
    const practiceBtn = page.getByRole('button', { name: /learn new cards|start practice/i });

    // Wait for either button or link to be visible
    await expect(practiceLink.or(practiceBtn)).toBeVisible({ timeout: 10000 });

    // Determine which one to click
    const practiceButton = await practiceBtn.isVisible() ? practiceBtn : practiceLink;

    // Click practice button and verify navigation
    {
      await practiceButton.click();
      await expect(page).toHaveURL(/practice/);

      // Verify practice page loads - look for Submit button, "Got it" (teaching card), or no cards state
      const submitButton = page.getByRole('button', { name: /submit/i });
      const gotItButton = page.getByRole('button', { name: /got it/i });
      const noCardsOnPractice = page.getByText(/no cards to practice/i);

      // Wait for either submit button, teaching card, or no cards message
      await expect(submitButton.or(gotItButton).or(noCardsOnPractice)).toBeVisible({ timeout: 10000 });

      // Handle teaching cards - click through them to get to exercises
      while (await gotItButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await gotItButton.click();
        // Wait a moment for the next card/exercise to load
        await page.waitForTimeout(500);
      }

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
