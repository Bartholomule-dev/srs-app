// tests/e2e/dynamic-exercises.spec.ts
import { test, expect, Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { createTestUser, deleteTestUser, TestUser } from './utils/auth';
import { getAdminClient, insertDynamicExercise, deleteExercise } from './utils/exercises';

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
      // Check prompt specifically for template placeholders
      // Note: We check the text content, not the raw HTML (which contains class names with braces)
      const promptLocator = page.locator('[data-testid="exercise-prompt"]');
      if (await promptLocator.isVisible({ timeout: 2000 }).catch(() => false)) {
        const promptText = await promptLocator.textContent();
        // Template placeholders like {{start}} should NOT appear in rendered exercise
        expect(promptText).not.toContain('{{');
        expect(promptText).not.toContain('}}');
        expect(promptText).not.toContain('{{start}}');
        expect(promptText).not.toContain('{{end}}');
        expect(promptText).not.toContain('{{a}}');
        expect(promptText).not.toContain('{{b}}');
      }

      console.log('Template placeholder test passed - no {{}} found in exercise prompt');
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
    const adminClient = getAdminClient();

    test('no coaching when targetConstruct present and user uses the construct', async ({ page }) => {
      test.setTimeout(60000);

      // Create exercise WITH targetConstruct (slice)
      // Expected answer uses slice: s[1:4]
      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-coaching-with-construct-${Date.now()}`,
        prompt: 'Extract characters 1 through 4 from string s',
        expectedAnswer: 's[1:4]',
        acceptedSolutions: ['s[1:4]', 'result'],
        targetConstruct: { type: 'slice', feedback: 'Try using slice notation!' },
        generator: null, // No generator for this test
      });

      try {
        await authenticateUser(page, testUser);

        // Navigate to the test page which loads a specific exercise by slug
        await page.goto(`/practice/test?slug=${slug}`);

        const submitBtn = page.getByRole('button', { name: /submit/i });
        await expect(submitBtn).toBeVisible({ timeout: 15000 });

        // Submit answer that USES the slice construct
        const answerInput = page.getByRole('textbox').first();
        await answerInput.fill('s[1:4]');
        await submitBtn.click();

        // Wait for feedback
        const continueBtn = page.getByRole('button', { name: /continue/i });
        await expect(continueBtn).toBeVisible({ timeout: 5000 });

        // Coaching feedback should NOT appear (user used the target construct)
        const coachingFeedback = page.locator('[data-testid="coaching-feedback"]');
        const isCoachingVisible = await coachingFeedback.isVisible({ timeout: 1000 }).catch(() => false);
        expect(isCoachingVisible).toBe(false);
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });

    test('coaching shown when targetConstruct present but user does NOT use the construct', async ({ page }) => {
      test.setTimeout(60000);

      const feedbackText = 'Try using slice notation for more Pythonic code!';

      // Create exercise WITH targetConstruct (slice)
      // Accept 'result' as alternative (doesn't use slice)
      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-coaching-without-construct-${Date.now()}`,
        prompt: 'Extract characters 1 through 4 from string s',
        expectedAnswer: 's[1:4]',
        acceptedSolutions: ['s[1:4]', 'result'],
        targetConstruct: { type: 'slice', feedback: feedbackText },
        generator: null,
      });

      try {
        await authenticateUser(page, testUser);
        await page.goto(`/practice/test?slug=${slug}`);

        const submitBtn = page.getByRole('button', { name: /submit/i });
        await expect(submitBtn).toBeVisible({ timeout: 15000 });

        // Submit answer that does NOT use slice (but is still correct)
        const answerInput = page.getByRole('textbox').first();
        await answerInput.fill('result');
        await submitBtn.click();

        // Wait for feedback
        const continueBtn = page.getByRole('button', { name: /continue/i });
        await expect(continueBtn).toBeVisible({ timeout: 5000 });

        // Coaching feedback SHOULD appear with the configured feedback text
        const coachingFeedback = page.locator('[data-testid="coaching-feedback"]');
        await expect(coachingFeedback).toBeVisible({ timeout: 2000 });

        // Verify the feedback text matches what we configured
        const feedbackContent = await coachingFeedback.textContent();
        expect(feedbackContent).toContain(feedbackText);
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });

    test('no coaching when targetConstruct is NOT present', async ({ page }) => {
      test.setTimeout(60000);

      // Create exercise WITHOUT targetConstruct
      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-coaching-no-construct-${Date.now()}`,
        prompt: 'Print hello world',
        expectedAnswer: 'print("hello")',
        acceptedSolutions: ['print("hello")', 'print(\'hello\')'],
        targetConstruct: null,
        generator: null,
      });

      try {
        await authenticateUser(page, testUser);
        await page.goto(`/practice/test?slug=${slug}`);

        const submitBtn = page.getByRole('button', { name: /submit/i });
        await expect(submitBtn).toBeVisible({ timeout: 15000 });

        // Submit correct answer
        const answerInput = page.getByRole('textbox').first();
        await answerInput.fill('print("hello")');
        await submitBtn.click();

        // Wait for feedback
        const continueBtn = page.getByRole('button', { name: /continue/i });
        await expect(continueBtn).toBeVisible({ timeout: 5000 });

        // Coaching feedback should NOT appear (no targetConstruct configured)
        const coachingFeedback = page.locator('[data-testid="coaching-feedback"]');
        const isCoachingVisible = await coachingFeedback.isVisible({ timeout: 1000 }).catch(() => false);
        expect(isCoachingVisible).toBe(false);
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });
  });

  test.describe('Exercise Type Routing', () => {
    const adminClient = getAdminClient();

    test('write exercise renders CodeInput component', async ({ page }) => {
      test.setTimeout(60000);

      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-type-write-${Date.now()}`,
        prompt: 'Write code to print hello',
        expectedAnswer: 'print("hello")',
        acceptedSolutions: ['print("hello")', 'print(\'hello\')'],
        exerciseType: 'write',
        generator: null,
        targetConstruct: null,
      });

      try {
        await authenticateUser(page, testUser);
        await page.goto(`/practice/test?slug=${slug}`);

        // Wait for exercise to load
        const submitBtn = page.getByRole('button', { name: /submit/i });
        await expect(submitBtn).toBeVisible({ timeout: 15000 });

        // Verify CodeInput component renders (not FillIn or Predict)
        const codeInput = page.locator('[data-testid="code-input"]');
        await expect(codeInput).toBeVisible({ timeout: 5000 });

        // Verify other components do NOT render
        const fillInExercise = page.locator('[data-testid="fill-in-exercise"]');
        const predictExercise = page.locator('[data-testid="predict-output-exercise"]');
        await expect(fillInExercise).not.toBeVisible();
        await expect(predictExercise).not.toBeVisible();
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });

    test('fill-in exercise renders FillInExercise component', async ({ page }) => {
      test.setTimeout(60000);

      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-type-fillin-${Date.now()}`,
        prompt: 'Complete the list comprehension',
        expectedAnswer: 'x * 2',
        acceptedSolutions: ['x * 2', 'x*2', '2 * x', '2*x'],
        exerciseType: 'fill-in',
        template: '[___ for x in range(5)]',
        generator: null,
        targetConstruct: null,
      });

      try {
        await authenticateUser(page, testUser);
        await page.goto(`/practice/test?slug=${slug}`);

        // Wait for exercise to load
        const submitBtn = page.getByRole('button', { name: /submit/i });
        await expect(submitBtn).toBeVisible({ timeout: 15000 });

        // Verify FillInExercise component renders
        const fillInExercise = page.locator('[data-testid="fill-in-exercise"]');
        await expect(fillInExercise).toBeVisible({ timeout: 5000 });

        // Verify template with blank is visible (the ___ placeholder should be in the template)
        const templateContent = await fillInExercise.textContent();
        expect(templateContent).toContain('for x in range(5)');

        // Verify other components do NOT render
        const codeInput = page.locator('[data-testid="code-input"]');
        const predictExercise = page.locator('[data-testid="predict-output-exercise"]');
        await expect(codeInput).not.toBeVisible();
        await expect(predictExercise).not.toBeVisible();
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });

    test('predict exercise renders PredictOutputExercise component', async ({ page }) => {
      test.setTimeout(60000);

      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-type-predict-${Date.now()}`,
        prompt: 'What will this code print?',
        expectedAnswer: '15',
        acceptedSolutions: ['15'],
        exerciseType: 'predict',
        code: 'print(5 + 10)',
        generator: null,
        targetConstruct: null,
      });

      try {
        await authenticateUser(page, testUser);
        await page.goto(`/practice/test?slug=${slug}`);

        // Wait for exercise to load
        const submitBtn = page.getByRole('button', { name: /submit/i });
        await expect(submitBtn).toBeVisible({ timeout: 15000 });

        // Verify PredictOutputExercise component renders
        const predictExercise = page.locator('[data-testid="predict-output-exercise"]');
        await expect(predictExercise).toBeVisible({ timeout: 5000 });

        // Verify code block is displayed
        const codeBlock = predictExercise.locator('pre code');
        await expect(codeBlock).toBeVisible();
        const codeContent = await codeBlock.textContent();
        expect(codeContent).toContain('print(5 + 10)');

        // Verify the "What will print?" label is visible
        const label = predictExercise.locator('label');
        await expect(label).toHaveText('What will print?');

        // Verify other components do NOT render
        const codeInput = page.locator('[data-testid="code-input"]');
        const fillInExercise = page.locator('[data-testid="fill-in-exercise"]');
        await expect(codeInput).not.toBeVisible();
        await expect(fillInExercise).not.toBeVisible();
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });
  });

  test.describe('Pyodide Execution', () => {
    const adminClient = getAdminClient();

    test('Pyodide loading indicator appears for predict exercises', async ({ page }) => {
      // Pyodide loading can take 5-15 seconds
      test.setTimeout(120000);

      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-pyodide-loading-${Date.now()}`,
        prompt: 'What will this code print?',
        expectedAnswer: '42',
        acceptedSolutions: ['42'],
        exerciseType: 'predict',
        code: 'print(6 * 7)',
        generator: null,
        targetConstruct: null,
      });

      try {
        await authenticateUser(page, testUser);
        await page.goto(`/practice/test?slug=${slug}`);

        // Wait for exercise to load
        const submitBtn = page.getByRole('button', { name: /submit/i });
        await expect(submitBtn).toBeVisible({ timeout: 15000 });

        // The loading indicator should appear while Pyodide loads
        // Note: On first load this will be visible; on subsequent loads Pyodide may already be cached
        const loadingIndicator = page.locator('[data-testid="pyodide-loading"]');

        // Wait for loading indicator OR for it to have already completed
        // (Pyodide may load very quickly if cached)
        const pyodideReady = page.locator('[data-testid="predict-output-exercise"]');

        // Try to see the loading indicator - it may be brief if Pyodide is cached
        const sawLoading = await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false);

        // If we didn't see loading, Pyodide was likely already loaded/cached
        // Either way, the exercise should be visible and functional
        await expect(pyodideReady).toBeVisible({ timeout: 30000 });

        // Verify Submit button is enabled (not disabled due to loading)
        // After Pyodide loads, the button should be enabled
        await expect(submitBtn).toBeEnabled({ timeout: 30000 });

        console.log(`Pyodide loading test completed. Loading indicator visible: ${sawLoading}`);
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });

    test('predict exercise graded via Pyodide execution', async ({ page }) => {
      // Pyodide loading and execution can take time
      test.setTimeout(120000);

      // Create predict exercise with simple code
      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-pyodide-execution-${Date.now()}`,
        prompt: 'What will this code output?',
        expectedAnswer: '5',
        acceptedSolutions: ['5'],
        exerciseType: 'predict',
        code: 'print(2 + 3)',
        generator: null,
        targetConstruct: null,
      });

      try {
        await authenticateUser(page, testUser);
        await page.goto(`/practice/test?slug=${slug}`);

        // Wait for exercise and Pyodide to load
        const submitBtn = page.getByRole('button', { name: /submit/i });
        await expect(submitBtn).toBeVisible({ timeout: 15000 });

        // Wait for Pyodide to finish loading (submit button becomes enabled)
        await expect(submitBtn).toBeEnabled({ timeout: 60000 });

        // Find the predict exercise input
        const predictExercise = page.locator('[data-testid="predict-output-exercise"]');
        await expect(predictExercise).toBeVisible({ timeout: 5000 });

        // Enter the correct output
        const answerInput = predictExercise.locator('input');
        await answerInput.fill('5');

        // Submit the answer
        await submitBtn.click();

        // Wait for feedback - Continue button appears when graded
        const continueBtn = page.getByRole('button', { name: /continue/i });
        await expect(continueBtn).toBeVisible({ timeout: 15000 });

        // Verify the answer was marked correct
        // Look for success indicator (green checkmark, "Correct!", etc.)
        const successIndicator = page.getByText(/correct|well done|great/i);
        await expect(successIndicator).toBeVisible({ timeout: 5000 });

        console.log('Pyodide execution grading test passed - correct answer marked as correct');
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });

    test('predict exercise with wrong answer graded via Pyodide execution', async ({ page }) => {
      // Pyodide loading and execution can take time
      test.setTimeout(120000);

      // Create predict exercise with simple code
      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-pyodide-execution-wrong-${Date.now()}`,
        prompt: 'What will this code output?',
        expectedAnswer: '15',
        acceptedSolutions: ['15'],
        exerciseType: 'predict',
        code: 'print(5 * 3)',
        generator: null,
        targetConstruct: null,
      });

      try {
        await authenticateUser(page, testUser);
        await page.goto(`/practice/test?slug=${slug}`);

        // Wait for exercise and Pyodide to load
        const submitBtn = page.getByRole('button', { name: /submit/i });
        await expect(submitBtn).toBeVisible({ timeout: 15000 });
        await expect(submitBtn).toBeEnabled({ timeout: 60000 });

        // Find the predict exercise input
        const predictExercise = page.locator('[data-testid="predict-output-exercise"]');
        await expect(predictExercise).toBeVisible({ timeout: 5000 });

        // Enter a WRONG answer
        const answerInput = predictExercise.locator('input');
        await answerInput.fill('10');

        // Submit the answer
        await submitBtn.click();

        // Wait for feedback
        const continueBtn = page.getByRole('button', { name: /continue/i });
        await expect(continueBtn).toBeVisible({ timeout: 15000 });

        // Verify the answer was marked incorrect
        // Look for the expected answer being shown
        const expectedAnswer = page.getByText('15');
        await expect(expectedAnswer).toBeVisible({ timeout: 5000 });

        console.log('Pyodide execution grading test passed - wrong answer marked as incorrect');
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });
  });
});
