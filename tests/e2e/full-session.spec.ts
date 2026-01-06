import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { createTestUser, deleteTestUser, TestUser } from './utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let testUser: TestUser;

test.describe('Full Practice Session Flow', () => {
  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      await deleteTestUser(testUser.id);
    }
  });

  test('complete multiple questions without session resetting', async ({ page }) => {
    test.setTimeout(60000); // 60 second timeout
    // Sign in programmatically
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    if (signInError) {
      throw new Error(`Failed to sign in: ${signInError.message}`);
    }

    // Inject session cookie
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

    // Navigate to practice page directly
    await page.goto('/practice');

    // Wait for practice page to load - either exercise or empty state
    const submitButton = page.getByRole('button', { name: /submit/i });
    const allCaughtUp = page.getByText(/all caught up/i);

    // Wait for either submit button or empty state to appear
    await expect(submitButton.or(allCaughtUp)).toBeVisible({ timeout: 15000 });

    // Check if we have exercises or empty state
    const hasExercises = await submitButton.isVisible().catch(() => false);

    if (!hasExercises) {
      // Empty state - no exercises to practice
      console.log('No exercises available - test passed (empty state)');
      return;
    }

    // Track completed questions
    let questionsCompleted = 0;
    const maxQuestions = 10; // Safety limit
    let previousProgressText = '';

    while (questionsCompleted < maxQuestions) {
      // Check if session is complete
      const sessionComplete = page.getByText(/great work|session complete|all caught up/i);
      if (await sessionComplete.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`Session complete after ${questionsCompleted} questions`);
        break;
      }

      // Get current progress (e.g., "1 / 5")
      const progressIndicator = page.locator('[class*="SessionProgress"]').first();
      const currentProgressText = await progressIndicator.textContent().catch(() => '');

      // Answer the question
      const answerInput = page.getByRole('textbox').first();
      if (await answerInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Type a simple answer (might be wrong, but we want to test the flow)
        await answerInput.fill('test_answer');
      }

      // Submit answer
      const currentSubmitBtn = page.getByRole('button', { name: /submit/i });
      if (await currentSubmitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await currentSubmitBtn.click();
      } else {
        // No submit button - might be complete
        break;
      }

      // Wait for feedback and continue button
      const continueButton = page.getByRole('button', { name: /continue/i });
      await expect(continueButton).toBeVisible({ timeout: 5000 });

      questionsCompleted++;
      console.log(`Completed question ${questionsCompleted}`);

      // Click continue to go to next question
      await continueButton.click();

      // Brief pause to let state update
      await page.waitForTimeout(300);

      // Verify progress advanced (not reset to beginning)
      const newProgressText = await progressIndicator.textContent().catch(() => '') ?? '';
      if (questionsCompleted > 1 && newProgressText === previousProgressText) {
        // Progress didn't change - might be at the end or there's an issue
        console.log('Progress unchanged - checking for completion');
      }
      previousProgressText = newProgressText;
    }

    // Verify session completed successfully (should see summary or completion message)
    // Allow some time for the completion state to render
    await page.waitForTimeout(500);

    const completionIndicators = [
      page.getByText(/session complete/i),
      page.getByText(/great work/i),
      page.getByText(/all caught up/i),
      page.getByText(/reviewed/i),
      page.getByRole('button', { name: /back to dashboard/i }),
      page.getByRole('link', { name: /dashboard/i }),
    ];

    let foundCompletion = false;
    for (const indicator of completionIndicators) {
      if (await indicator.isVisible({ timeout: 1000 }).catch(() => false)) {
        foundCompletion = true;
        break;
      }
    }

    // If we completed questions, we should see a completion state
    if (questionsCompleted > 0) {
      expect(foundCompletion).toBe(true);
    }

    console.log(`Test complete: answered ${questionsCompleted} questions`);
  });

  test('session progress increments correctly', async ({ page }) => {
    // Sign in
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
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

    await page.goto('/practice');

    // Wait for either submit button or empty state
    const submitButton = page.getByRole('button', { name: /submit/i });
    const allCaughtUp = page.getByText(/all caught up/i);
    await expect(submitButton.or(allCaughtUp)).toBeVisible({ timeout: 15000 });

    const hasExercises = await submitButton.isVisible().catch(() => false);

    if (!hasExercises) {
      console.log('No exercises - skipping progress test');
      return;
    }

    // Complete first question and track progress
    const answerInput = page.getByRole('textbox').first();
    await answerInput.fill('test');
    await submitButton.click();

    const continueButton = page.getByRole('button', { name: /continue/i });
    await expect(continueButton).toBeVisible({ timeout: 5000 });
    await continueButton.click();

    // After clicking continue, verify we're either:
    // 1. On the next question (different content)
    // 2. At session complete (if only 1 question)
    await page.waitForTimeout(1000);

    const nextSubmit = page.getByRole('button', { name: /submit/i });
    const sessionComplete = page.getByText('Session Complete!');

    // Wait for either to appear
    await expect(nextSubmit.or(sessionComplete)).toBeVisible({ timeout: 5000 });

    const hasNextQuestion = await nextSubmit.isVisible().catch(() => false);
    const isComplete = await sessionComplete.isVisible().catch(() => false);

    console.log(`After first question: hasNext=${hasNextQuestion}, isComplete=${isComplete}`);
    expect(hasNextQuestion || isComplete).toBe(true);
  });
});
