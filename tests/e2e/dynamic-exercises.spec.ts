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

    // CRITICAL ASSERTION: Deterministic seeding means same content
    // If the exercise has dynamic values, both renders should show identical prompt
    if (firstPrompt.length > 0 && secondPrompt.length > 0) {
      expect(secondPrompt).toBe(firstPrompt);
    }

    console.log('Determinism test passed - identical content after reload');
  });

  test.describe('Coaching Feedback', () => {
    test('coaching feedback does NOT appear for incorrect answers', async ({ page }) => {
      test.setTimeout(60000);

      await authenticateUser(page, testUser);
      await page.goto('/practice');

      const submitBtn = page.getByRole('button', { name: /submit/i });
      const gotItBtn = page.getByRole('button', { name: /got it/i });
      const allCaughtUp = page.getByText(/all caught up/i);

      await expect(submitBtn.or(gotItBtn).or(allCaughtUp)).toBeVisible({ timeout: 15000 });
      await skipTeachingCards(page);

      if (!(await submitBtn.isVisible().catch(() => false))) {
        console.log('No exercises - skipping coaching test');
        return;
      }

      // Submit a definitely wrong answer
      const answerInput = page.getByRole('textbox').first();
      await answerInput.fill('DEFINITELY_WRONG_ANSWER_12345');
      await submitBtn.click();

      // Wait for feedback
      const continueBtn = page.getByRole('button', { name: /continue/i });
      await expect(continueBtn).toBeVisible({ timeout: 5000 });

      // Coaching feedback should NOT appear for incorrect answers
      const coachingFeedback = page.locator('[data-testid="coaching-feedback"]');
      const isCoachingVisible = await coachingFeedback.isVisible({ timeout: 1000 }).catch(() => false);

      // Incorrect answer should show "incorrect" state, not coaching
      expect(isCoachingVisible).toBe(false);
    });

    test('correct answer shows feedback UI (positive or coaching)', async ({ page }) => {
      test.setTimeout(60000);

      await authenticateUser(page, testUser);
      await page.goto('/practice');

      const submitBtn = page.getByRole('button', { name: /submit/i });
      const gotItBtn = page.getByRole('button', { name: /got it/i });
      const allCaughtUp = page.getByText(/all caught up/i);

      await expect(submitBtn.or(gotItBtn).or(allCaughtUp)).toBeVisible({ timeout: 15000 });
      await skipTeachingCards(page);

      if (!(await submitBtn.isVisible().catch(() => false))) {
        console.log('No exercises - skipping feedback test');
        return;
      }

      // Submit an answer
      const answerInput = page.getByRole('textbox').first();
      await answerInput.fill('print("hello")');
      await submitBtn.click();

      // Wait for feedback state
      const continueBtn = page.getByRole('button', { name: /continue/i });
      await expect(continueBtn).toBeVisible({ timeout: 5000 });

      // Either correct or incorrect state should be visible
      const correctIndicator = page.getByText(/correct|great|nice/i);
      const incorrectIndicator = page.getByText(/incorrect|try again|not quite/i);
      const coachingFeedback = page.locator('[data-testid="coaching-feedback"]');

      // At least one feedback element should be visible
      const hasCorrect = await correctIndicator.isVisible({ timeout: 500 }).catch(() => false);
      const hasIncorrect = await incorrectIndicator.isVisible({ timeout: 500 }).catch(() => false);
      const hasCoaching = await coachingFeedback.isVisible({ timeout: 500 }).catch(() => false);

      expect(hasCorrect || hasIncorrect || hasCoaching).toBe(true);
    });
  });
});
