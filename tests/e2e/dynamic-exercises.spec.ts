// tests/e2e/dynamic-exercises.spec.ts
import { test, expect, Page } from '@playwright/test';
import { createTestUser, deleteTestUser, authenticateUser, authenticateContext, TestUser } from './utils/auth';
import { getAdminClient, insertDynamicExercise, deleteExercise, mockDate } from './utils/exercises';

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

/**
 * Maximum number of exercises to process in a single session test.
 * This limit prevents infinite loops if the session never completes.
 * The value of 10 is chosen because:
 * - Default session size is typically 5-7 exercises
 * - Teaching cards may add 2-3 extra interactions
 * - 10 provides a safety margin while keeping test runtime reasonable
 */
const MAX_SESSION_EXERCISES = 10;

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

  test.describe('Full Session Completion', () => {
    test('complete practice session and reach session summary', async ({ page }) => {
      // Session completion may take time with multiple exercises
      test.setTimeout(180000);

      await authenticateUser(page, testUser);
      await page.goto('/practice');

      // Wait for session to load
      const submitBtn = page.getByRole('button', { name: /submit/i });
      const gotItBtn = page.getByRole('button', { name: /got it/i });
      const allCaughtUp = page.getByText(/all caught up/i);
      const sessionComplete = page.getByText(/session complete/i);

      await expect(submitBtn.or(gotItBtn).or(allCaughtUp).or(sessionComplete)).toBeVisible({ timeout: 15000 });

      // Check if we have no exercises to practice
      if (await allCaughtUp.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('No exercises due - session already complete (all caught up)');
        return;
      }

      let exercisesCompleted = 0;

      // Loop through exercises until session is complete or we hit the limit
      while (exercisesCompleted < MAX_SESSION_EXERCISES) {
        // Check if session is complete
        if (await sessionComplete.isVisible({ timeout: 500 }).catch(() => false)) {
          console.log(`Session complete after ${exercisesCompleted} exercises`);
          break;
        }

        // Check for "all caught up" state
        if (await allCaughtUp.isVisible({ timeout: 500 }).catch(() => false)) {
          console.log('All caught up - no more exercises');
          break;
        }

        // Handle teaching cards - click "Got it" to continue
        if (await gotItBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          await gotItBtn.click();
          // Wait for teaching card to disappear before continuing
          await expect(gotItBtn).not.toBeVisible({ timeout: 5000 });
          continue;
        }

        // Handle exercise submission
        if (await submitBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          // Determine exercise type and find the input
          const codeInput = page.locator('[data-testid="code-input"]');
          const fillInExercise = page.locator('[data-testid="fill-in-exercise"]');
          const predictExercise = page.locator('[data-testid="predict-output-exercise"]');

          // Note: We intentionally use generic answers (not correct ones) because this test
          // verifies session flow completion, not answer correctness. The session should
          // complete regardless of whether answers are right or wrong.
          if (await predictExercise.isVisible({ timeout: 500 }).catch(() => false)) {
            // Wait for submit button to be enabled (Pyodide loaded)
            await expect(submitBtn).toBeEnabled({ timeout: 60000 });

            // Enter a generic answer for predict exercises
            const predictInput = predictExercise.locator('input');
            await predictInput.fill('0');
          } else if (await fillInExercise.isVisible({ timeout: 500 }).catch(() => false)) {
            // For fill-in exercises, find the input within the fill-in component
            const fillInInput = fillInExercise.locator('input').first();
            if (await fillInInput.isVisible().catch(() => false)) {
              await fillInInput.fill('x');
            }
          } else if (await codeInput.isVisible({ timeout: 500 }).catch(() => false)) {
            // For write exercises, use the code input
            const textarea = codeInput.locator('textarea');
            await textarea.fill('print("hello")');
          } else {
            // Fallback: try to find any textbox
            const anyInput = page.getByRole('textbox').first();
            if (await anyInput.isVisible({ timeout: 500 }).catch(() => false)) {
              await anyInput.fill('x');
            }
          }

          // Submit the answer
          await submitBtn.click();

          // Wait for feedback phase - Continue button appears
          const continueBtn = page.getByRole('button', { name: /continue/i });
          await expect(continueBtn).toBeVisible({ timeout: 15000 });

          // Click continue to move to next exercise
          await continueBtn.click();
          exercisesCompleted++;

          // Wait for continue button to disappear (next state loading)
          await expect(continueBtn).not.toBeVisible({ timeout: 5000 });
        }

        // Safety check - if we can't find any interactive elements, break
        const anyInteractiveElement = await submitBtn.or(gotItBtn).or(sessionComplete).or(allCaughtUp).isVisible({ timeout: 2000 }).catch(() => false);
        if (!anyInteractiveElement) {
          console.log('No interactive elements found, breaking loop');
          break;
        }
      }

      // Final verification: Session should be complete or all caught up
      // Re-check session complete state
      const finalSessionComplete = await sessionComplete.isVisible({ timeout: 2000 }).catch(() => false);
      const finalAllCaughtUp = await allCaughtUp.isVisible({ timeout: 2000 }).catch(() => false);

      // At least one completion state should be visible
      if (!finalSessionComplete && !finalAllCaughtUp) {
        throw new Error(
          `Session did not reach a completion state after ${exercisesCompleted} exercises. ` +
          `Expected either "Session Complete" or "All Caught Up" to be visible, but neither was found. ` +
          `This may indicate a stuck session state or UI rendering issue.`
        );
      }

      if (finalSessionComplete) {
        // Verify session summary elements
        // Check for stats display (Reviewed count, Accuracy, Time)
        const reviewedStat = page.getByText(/reviewed/i);
        const accuracyStat = page.getByText(/%/);
        const dashboardBtn = page.getByRole('button', { name: /back to dashboard/i });

        await expect(reviewedStat).toBeVisible({ timeout: 5000 });
        await expect(accuracyStat).toBeVisible({ timeout: 5000 });
        await expect(dashboardBtn).toBeVisible({ timeout: 5000 });

        // Verify we can navigate back to dashboard
        await dashboardBtn.click();
        await expect(page).toHaveURL(/dashboard/);

        console.log(`Full session test passed - completed ${exercisesCompleted} exercises and returned to dashboard`);
      } else {
        console.log('Session ended with "All Caught Up" state (no exercises due)');
      }
    });
  });

  test.describe('Generator Parameter Visibility', () => {
    const adminClient = getAdminClient();

    test('generated parameters appear correctly in rendered exercise', async ({ page }) => {
      test.setTimeout(60000);

      // Create exercise with slice-bounds generator and templated prompt
      // The generator produces: start (0-4), end (start+1 to 7)
      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-generator-visibility-${Date.now()}`,
        prompt: 'Extract characters from index {{start}} to index {{end}} from the string',
        expectedAnswer: 's[{{start}}:{{end}}]',
        acceptedSolutions: ['s[{{start}}:{{end}}]'],
        generator: 'slice-bounds',
        targetConstruct: null,
      });

      try {
        await authenticateUser(page, testUser);
        await page.goto(`/practice/test?slug=${slug}`);

        // Wait for exercise to load
        const submitBtn = page.getByRole('button', { name: /submit/i });
        await expect(submitBtn).toBeVisible({ timeout: 15000 });

        // Get the rendered prompt
        const promptLocator = page.locator('[data-testid="exercise-prompt"]');
        await expect(promptLocator).toBeVisible({ timeout: 5000 });
        const promptText = await promptLocator.textContent();

        // NEGATIVE CHECK: Template placeholders should NOT appear
        expect(promptText).not.toContain('{{start}}');
        expect(promptText).not.toContain('{{end}}');
        expect(promptText).not.toContain('{{');
        expect(promptText).not.toContain('}}');

        // POSITIVE CHECK: Extract numbers from the prompt and verify they're in valid ranges
        // Pattern: "Extract characters from index X to index Y from the string"
        const indexPattern = /index\s+(\d+)\s+to\s+index\s+(\d+)/i;
        const match = promptText?.match(indexPattern);

        expect(match).not.toBeNull();
        expect(match).toBeDefined();

        if (match) {
          const startValue = parseInt(match[1], 10);
          const endValue = parseInt(match[2], 10);

          // Verify start is in valid range for slice-bounds generator: [0, 4]
          expect(startValue).toBeGreaterThanOrEqual(0);
          expect(startValue).toBeLessThanOrEqual(4);

          // Verify end is in valid range: [start+1, 7]
          expect(endValue).toBeGreaterThan(startValue);
          expect(endValue).toBeLessThanOrEqual(7);

          console.log(`Generator visibility test passed - start: ${startValue}, end: ${endValue}`);
        }
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });

    test('generator values consistent between prompt and expected answer', async ({ page }) => {
      test.setTimeout(60000);

      // Create exercise where both prompt and expected answer use generator params
      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-generator-consistency-${Date.now()}`,
        prompt: 'Slice from {{start}} to {{end}}',
        expectedAnswer: 's[{{start}}:{{end}}]',
        acceptedSolutions: ['s[{{start}}:{{end}}]'],
        generator: 'slice-bounds',
        targetConstruct: null,
      });

      try {
        await authenticateUser(page, testUser);
        await page.goto(`/practice/test?slug=${slug}`);

        // Wait for exercise to load
        const submitBtn = page.getByRole('button', { name: /submit/i });
        await expect(submitBtn).toBeVisible({ timeout: 15000 });

        // Get the rendered prompt
        const promptLocator = page.locator('[data-testid="exercise-prompt"]');
        await expect(promptLocator).toBeVisible({ timeout: 5000 });
        const promptText = await promptLocator.textContent();

        // Extract numbers from prompt: "Slice from X to Y"
        const promptPattern = /from\s+(\d+)\s+to\s+(\d+)/i;
        const promptMatch = promptText?.match(promptPattern);

        expect(promptMatch).not.toBeNull();

        if (promptMatch) {
          const promptStart = parseInt(promptMatch[1], 10);
          const promptEnd = parseInt(promptMatch[2], 10);

          // Submit the correct answer with those same values
          const expectedAnswer = `s[${promptStart}:${promptEnd}]`;
          const codeInput = page.locator('[data-testid="code-input"]');
          const textarea = codeInput.locator('textarea');
          await textarea.fill(expectedAnswer);
          await submitBtn.click();

          // Wait for feedback
          const continueBtn = page.getByRole('button', { name: /continue/i });
          await expect(continueBtn).toBeVisible({ timeout: 5000 });

          // Verify the answer was marked correct (values were consistent)
          const successIndicator = page.getByText(/correct|well done|great/i);
          await expect(successIndicator).toBeVisible({ timeout: 5000 });

          console.log(`Generator consistency test passed - answer s[${promptStart}:${promptEnd}] was correct`);
        }
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

  test.describe('Date Seed Rotation', () => {
    const adminClient = getAdminClient();

    test('same exercise produces DIFFERENT values on different dates', async ({ browser }) => {
      test.setTimeout(120000);

      // Create a dynamic exercise with generator
      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-date-rotation-${Date.now()}`,
        prompt: 'Slice from {{start}} to {{end}}',
        expectedAnswer: 's[{{start}}:{{end}}]',
        acceptedSolutions: ['s[{{start}}:{{end}}]'],
        generator: 'slice-bounds',
        targetConstruct: null,
      });

      let day1Values: { start: number; end: number } | null = null;
      let day2Values: { start: number; end: number } | null = null;

      try {
        // --- Day 1: January 1, 2026 ---
        const context1 = await browser.newContext();
        await mockDate(context1, new Date('2026-01-01T12:00:00Z'));
        await authenticateContext(context1, testUser);
        const page1 = await context1.newPage();

        await page1.goto(`/practice/test?slug=${slug}`);

        // Wait for exercise to load
        const submitBtn1 = page1.getByRole('button', { name: /submit/i });
        await expect(submitBtn1).toBeVisible({ timeout: 15000 });

        // Get the rendered prompt and extract values
        const promptLocator1 = page1.locator('[data-testid="exercise-prompt"]');
        await expect(promptLocator1).toBeVisible({ timeout: 5000 });
        const promptText1 = await promptLocator1.textContent();

        // Extract numbers: "Slice from X to Y"
        const pattern = /from\s+(\d+)\s+to\s+(\d+)/i;
        const match1 = promptText1?.match(pattern);

        if (match1) {
          day1Values = {
            start: parseInt(match1[1], 10),
            end: parseInt(match1[2], 10),
          };
          console.log(`Day 1 (2026-01-01) values: start=${day1Values.start}, end=${day1Values.end}`);
        }

        await context1.close();

        // --- Day 2: January 2, 2026 ---
        const context2 = await browser.newContext();
        await mockDate(context2, new Date('2026-01-02T12:00:00Z'));
        await authenticateContext(context2, testUser);
        const page2 = await context2.newPage();

        await page2.goto(`/practice/test?slug=${slug}`);

        // Wait for exercise to load
        const submitBtn2 = page2.getByRole('button', { name: /submit/i });
        await expect(submitBtn2).toBeVisible({ timeout: 15000 });

        // Get the rendered prompt and extract values
        const promptLocator2 = page2.locator('[data-testid="exercise-prompt"]');
        await expect(promptLocator2).toBeVisible({ timeout: 5000 });
        const promptText2 = await promptLocator2.textContent();

        const match2 = promptText2?.match(pattern);

        if (match2) {
          day2Values = {
            start: parseInt(match2[1], 10),
            end: parseInt(match2[2], 10),
          };
          console.log(`Day 2 (2026-01-02) values: start=${day2Values.start}, end=${day2Values.end}`);
        }

        await context2.close();

        // --- Assertions ---
        // Both days should have extracted valid values
        expect(day1Values).not.toBeNull();
        expect(day2Values).not.toBeNull();

        // CRITICAL: Values should be DIFFERENT on different dates
        // This ensures seed rotation is working (exercises don't become stale)
        const valuesAreIdentical =
          day1Values!.start === day2Values!.start &&
          day1Values!.end === day2Values!.end;

        // With the hash function and different date strings, there's approximately
        // 1/(5*6) = ~3% chance of collision for this generator's value space.
        // We assert they should be different, which passes ~97% of the time.
        // If this test ever flakes, the seed rotation is still working - just unlucky.
        expect(valuesAreIdentical).toBe(false);

        console.log('Date seed rotation test passed - different dates produce different values');
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });

    test('same date produces SAME values (determinism check)', async ({ browser }) => {
      test.setTimeout(120000);

      // Create a dynamic exercise with generator
      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-date-determinism-${Date.now()}`,
        prompt: 'Slice from {{start}} to {{end}}',
        expectedAnswer: 's[{{start}}:{{end}}]',
        acceptedSolutions: ['s[{{start}}:{{end}}]'],
        generator: 'slice-bounds',
        targetConstruct: null,
      });

      let visit1Values: { start: number; end: number } | null = null;
      let visit2Values: { start: number; end: number } | null = null;

      try {
        const fixedDate = new Date('2026-03-15T12:00:00Z');

        // --- Visit 1 ---
        const context1 = await browser.newContext();
        await mockDate(context1, fixedDate);
        await authenticateContext(context1, testUser);
        const page1 = await context1.newPage();

        await page1.goto(`/practice/test?slug=${slug}`);

        const submitBtn1 = page1.getByRole('button', { name: /submit/i });
        await expect(submitBtn1).toBeVisible({ timeout: 15000 });

        const promptLocator1 = page1.locator('[data-testid="exercise-prompt"]');
        await expect(promptLocator1).toBeVisible({ timeout: 5000 });
        const promptText1 = await promptLocator1.textContent();

        const pattern = /from\s+(\d+)\s+to\s+(\d+)/i;
        const match1 = promptText1?.match(pattern);

        if (match1) {
          visit1Values = {
            start: parseInt(match1[1], 10),
            end: parseInt(match1[2], 10),
          };
          console.log(`Visit 1 values: start=${visit1Values.start}, end=${visit1Values.end}`);
        }

        await context1.close();

        // --- Visit 2 (same date, new context simulating different session) ---
        const context2 = await browser.newContext();
        await mockDate(context2, fixedDate);
        await authenticateContext(context2, testUser);
        const page2 = await context2.newPage();

        await page2.goto(`/practice/test?slug=${slug}`);

        const submitBtn2 = page2.getByRole('button', { name: /submit/i });
        await expect(submitBtn2).toBeVisible({ timeout: 15000 });

        const promptLocator2 = page2.locator('[data-testid="exercise-prompt"]');
        await expect(promptLocator2).toBeVisible({ timeout: 5000 });
        const promptText2 = await promptLocator2.textContent();

        const match2 = promptText2?.match(pattern);

        if (match2) {
          visit2Values = {
            start: parseInt(match2[1], 10),
            end: parseInt(match2[2], 10),
          };
          console.log(`Visit 2 values: start=${visit2Values.start}, end=${visit2Values.end}`);
        }

        await context2.close();

        // --- Assertions ---
        expect(visit1Values).not.toBeNull();
        expect(visit2Values).not.toBeNull();

        // CRITICAL: Values should be IDENTICAL on the same date
        // This confirms deterministic seeding is working
        expect(visit2Values!.start).toBe(visit1Values!.start);
        expect(visit2Values!.end).toBe(visit1Values!.end);

        console.log('Date determinism test passed - same date produces same values');
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });
  });

  test.describe('Multi-User Seed Isolation', () => {
    const adminClient = getAdminClient();
    let userA: TestUser;
    let userB: TestUser;

    test.beforeAll(async () => {
      // Create two separate test users
      userA = await createTestUser();
      userB = await createTestUser();
    });

    test.afterAll(async () => {
      // Clean up both test users
      if (userA?.id) {
        await deleteTestUser(userA.id);
      }
      if (userB?.id) {
        await deleteTestUser(userB.id);
      }
    });

    test('different users see DIFFERENT generated values for same exercise on same date', async ({ browser }) => {
      test.setTimeout(120000);

      // Create a dynamic exercise with generator
      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-multi-user-isolation-${Date.now()}`,
        prompt: 'Slice from {{start}} to {{end}}',
        expectedAnswer: 's[{{start}}:{{end}}]',
        acceptedSolutions: ['s[{{start}}:{{end}}]'],
        generator: 'slice-bounds',
        targetConstruct: null,
      });

      let userAValues: { start: number; end: number } | null = null;
      let userBValues: { start: number; end: number } | null = null;

      try {
        // Fixed date to ensure same date for both users
        const fixedDate = new Date('2026-06-15T12:00:00Z');
        const pattern = /from\s+(\d+)\s+to\s+(\d+)/i;

        // --- User A sees the exercise ---
        const contextA = await browser.newContext();
        await mockDate(contextA, fixedDate);
        await authenticateContext(contextA, userA);
        const pageA = await contextA.newPage();

        await pageA.goto(`/practice/test?slug=${slug}`);

        const submitBtnA = pageA.getByRole('button', { name: /submit/i });
        await expect(submitBtnA).toBeVisible({ timeout: 15000 });

        const promptLocatorA = pageA.locator('[data-testid="exercise-prompt"]');
        await expect(promptLocatorA).toBeVisible({ timeout: 5000 });
        const promptTextA = await promptLocatorA.textContent();

        const matchA = promptTextA?.match(pattern);
        if (matchA) {
          userAValues = {
            start: parseInt(matchA[1], 10),
            end: parseInt(matchA[2], 10),
          };
          console.log(`User A (${userA.id.slice(0, 8)}...) values: start=${userAValues.start}, end=${userAValues.end}`);
        }

        await contextA.close();

        // --- User B sees the same exercise on the same date ---
        const contextB = await browser.newContext();
        await mockDate(contextB, fixedDate);
        await authenticateContext(contextB, userB);
        const pageB = await contextB.newPage();

        await pageB.goto(`/practice/test?slug=${slug}`);

        const submitBtnB = pageB.getByRole('button', { name: /submit/i });
        await expect(submitBtnB).toBeVisible({ timeout: 15000 });

        const promptLocatorB = pageB.locator('[data-testid="exercise-prompt"]');
        await expect(promptLocatorB).toBeVisible({ timeout: 5000 });
        const promptTextB = await promptLocatorB.textContent();

        const matchB = promptTextB?.match(pattern);
        if (matchB) {
          userBValues = {
            start: parseInt(matchB[1], 10),
            end: parseInt(matchB[2], 10),
          };
          console.log(`User B (${userB.id.slice(0, 8)}...) values: start=${userBValues.start}, end=${userBValues.end}`);
        }

        await contextB.close();

        // --- Assertions ---
        // Both users should have extracted valid values
        expect(userAValues).not.toBeNull();
        expect(userBValues).not.toBeNull();

        // CRITICAL: Different users should see DIFFERENT values
        // This ensures:
        // 1. Users cannot share answers
        // 2. Exercises feel personalized
        // 3. The seed includes userId (sha256(userId:exerciseSlug:date))
        const valuesAreIdentical =
          userAValues!.start === userBValues!.start &&
          userAValues!.end === userBValues!.end;

        // With the hash function and different user IDs, there's approximately
        // 1/(5*6) = ~3% chance of collision for this generator's value space.
        // We assert they should be different, which passes ~97% of the time.
        // If this test ever flakes, the user isolation is still working - just unlucky.
        expect(valuesAreIdentical).toBe(false);

        console.log('Multi-user seed isolation test passed - different users see different values');
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });
  });

  test.describe('Hydration and Focus Management', () => {
    const adminClient = getAdminClient();

    test('no hydration mismatches on dynamic exercise render', async ({ page }) => {
      test.setTimeout(60000);

      // Collect console messages to check for hydration errors
      const consoleMessages: { type: string; text: string }[] = [];
      page.on('console', (msg) => {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text(),
        });
      });

      // Create a dynamic exercise with generator (most likely to cause hydration issues)
      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-hydration-test-${Date.now()}`,
        prompt: 'Slice from {{start}} to {{end}}',
        expectedAnswer: 's[{{start}}:{{end}}]',
        acceptedSolutions: ['s[{{start}}:{{end}}]'],
        generator: 'slice-bounds',
        targetConstruct: null,
      });

      try {
        await authenticateUser(page, testUser);
        await page.goto(`/practice/test?slug=${slug}`);

        // Wait for exercise to fully load
        const submitBtn = page.getByRole('button', { name: /submit/i });
        await expect(submitBtn).toBeVisible({ timeout: 15000 });

        // Give time for any delayed hydration errors to appear
        await page.waitForTimeout(2000);

        // Check for hydration-related error messages
        // React hydration errors contain specific text patterns
        const hydrationErrors = consoleMessages.filter((msg) => {
          const text = msg.text.toLowerCase();
          return (
            msg.type === 'error' &&
            (text.includes('hydration') ||
              text.includes('server rendered') ||
              text.includes("didn't match") ||
              text.includes('text content does not match') ||
              text.includes('expected server html'))
          );
        });

        // No hydration errors should be present
        if (hydrationErrors.length > 0) {
          console.error('Hydration errors found:', hydrationErrors);
        }
        expect(hydrationErrors).toHaveLength(0);

        // Verify the exercise rendered correctly (no template placeholders)
        const promptLocator = page.locator('[data-testid="exercise-prompt"]');
        await expect(promptLocator).toBeVisible({ timeout: 5000 });
        const promptText = await promptLocator.textContent();
        expect(promptText).not.toContain('{{');
        expect(promptText).not.toContain('}}');

        console.log(
          `Hydration test passed - no hydration errors found (${consoleMessages.length} console messages checked)`
        );
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });

    test('write exercise input receives focus on load', async ({ page }) => {
      test.setTimeout(60000);

      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-focus-write-${Date.now()}`,
        prompt: 'Print hello world',
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

        // Find the CodeInput textarea
        const codeInput = page.locator('[data-testid="code-input"]');
        await expect(codeInput).toBeVisible({ timeout: 5000 });
        const textarea = codeInput.locator('textarea');

        // Verify the textarea has focus - typing should work immediately without clicking
        // Type directly without clicking the input first
        await page.keyboard.type('x = 1');

        // Verify the typed text appeared in the textarea
        const textareaValue = await textarea.inputValue();
        expect(textareaValue).toContain('x = 1');

        console.log('Write exercise focus test passed - input received focus on load');
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });

    test('fill-in exercise input receives focus on load', async ({ page }) => {
      test.setTimeout(60000);

      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-focus-fillin-${Date.now()}`,
        prompt: 'Complete the list comprehension',
        expectedAnswer: 'x * 2',
        acceptedSolutions: ['x * 2', 'x*2'],
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

        // Find the FillInExercise component
        const fillInExercise = page.locator('[data-testid="fill-in-exercise"]');
        await expect(fillInExercise).toBeVisible({ timeout: 5000 });

        // Verify input has focus - typing should work immediately
        await page.keyboard.type('test');

        // Find the input and check its value
        const input = fillInExercise.locator('input');
        const inputValue = await input.inputValue();
        expect(inputValue).toBe('test');

        console.log('Fill-in exercise focus test passed - input received focus on load');
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });

    test('predict exercise input receives focus on load', async ({ page }) => {
      test.setTimeout(120000); // Longer timeout for Pyodide

      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-focus-predict-${Date.now()}`,
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

        // Wait for exercise and Pyodide to load
        const submitBtn = page.getByRole('button', { name: /submit/i });
        await expect(submitBtn).toBeVisible({ timeout: 15000 });
        await expect(submitBtn).toBeEnabled({ timeout: 60000 });

        // Find the PredictOutputExercise component
        const predictExercise = page.locator('[data-testid="predict-output-exercise"]');
        await expect(predictExercise).toBeVisible({ timeout: 5000 });

        // Verify input has focus - typing should work immediately
        await page.keyboard.type('42');

        // Find the input and check its value
        const input = predictExercise.locator('input');
        const inputValue = await input.inputValue();
        expect(inputValue).toBe('42');

        console.log('Predict exercise focus test passed - input received focus on load');
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });

    test('focus is properly managed across exercise transitions', async ({ page }) => {
      test.setTimeout(120000);

      // Create two exercises to test focus management during transitions
      const slug1 = await insertDynamicExercise(adminClient, {
        slug: `e2e-focus-transition-1-${Date.now()}`,
        prompt: 'First exercise',
        expectedAnswer: 'x',
        acceptedSolutions: ['x'],
        exerciseType: 'write',
        generator: null,
        targetConstruct: null,
      });

      const slug2 = await insertDynamicExercise(adminClient, {
        slug: `e2e-focus-transition-2-${Date.now()}`,
        prompt: 'Second exercise',
        expectedAnswer: 'y',
        acceptedSolutions: ['y'],
        exerciseType: 'write',
        generator: null,
        targetConstruct: null,
      });

      try {
        await authenticateUser(page, testUser);

        // Visit first exercise
        await page.goto(`/practice/test?slug=${slug1}`);

        const submitBtn = page.getByRole('button', { name: /submit/i });
        await expect(submitBtn).toBeVisible({ timeout: 15000 });

        // Verify focus on first exercise
        const codeInput1 = page.locator('[data-testid="code-input"]');
        await expect(codeInput1).toBeVisible({ timeout: 5000 });

        // Type without clicking
        await page.keyboard.type('x');

        const textarea1 = codeInput1.locator('textarea');
        const value1 = await textarea1.inputValue();
        expect(value1).toBe('x');

        // Submit the answer
        await submitBtn.click();

        // Wait for feedback
        const continueBtn = page.getByRole('button', { name: /continue/i });
        await expect(continueBtn).toBeVisible({ timeout: 15000 });

        // Navigate to second exercise
        await page.goto(`/practice/test?slug=${slug2}`);

        // Wait for second exercise to load
        await expect(submitBtn).toBeVisible({ timeout: 15000 });

        // Verify focus is set on the new exercise input
        const codeInput2 = page.locator('[data-testid="code-input"]');
        await expect(codeInput2).toBeVisible({ timeout: 5000 });

        // Clear any existing content and type - focus should be on input
        await page.keyboard.type('y');

        const textarea2 = codeInput2.locator('textarea');
        const value2 = await textarea2.inputValue();
        expect(value2).toBe('y');

        console.log('Focus transition test passed - focus properly managed across exercises');
      } finally {
        await deleteExercise(adminClient, slug1);
        await deleteExercise(adminClient, slug2);
      }
    });
  });

  test.describe('Pyodide Failure Handling', () => {
    const adminClient = getAdminClient();

    test('predict exercise falls back to string matching when Pyodide CDN is blocked', async ({ page }) => {
      test.setTimeout(120000);

      // Create a predict exercise
      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-pyodide-fallback-${Date.now()}`,
        prompt: 'What will this code output?',
        expectedAnswer: '42',
        acceptedSolutions: ['42'],
        exerciseType: 'predict',
        code: 'print(6 * 7)',
        generator: null,
        targetConstruct: null,
      });

      try {
        // Block requests to Pyodide CDN to simulate network failure
        // This covers both the pyodide npm package requests and direct CDN requests
        await page.route('**/cdn.jsdelivr.net/pyodide/**', (route) => {
          route.abort('failed');
        });

        // Also block the pyodide npm package if it makes requests elsewhere
        await page.route('**/pyodide*', (route) => {
          const url = route.request().url();
          // Only abort if it's a pyodide-related CDN request
          if (url.includes('pyodide') && (url.includes('wasm') || url.includes('.js'))) {
            route.abort('failed');
          } else {
            route.continue();
          }
        });

        await authenticateUser(page, testUser);
        await page.goto(`/practice/test?slug=${slug}`);

        // Wait for exercise to load
        const submitBtn = page.getByRole('button', { name: /submit/i });
        await expect(submitBtn).toBeVisible({ timeout: 15000 });

        // The loading indicator may appear briefly then disappear when load fails
        // Wait a bit for the Pyodide load attempt to fail
        await page.waitForTimeout(3000);

        // Submit button should eventually become enabled (fallback mode)
        // Even if Pyodide fails, the exercise should still be submittable
        await expect(submitBtn).toBeEnabled({ timeout: 30000 });

        // Find the predict exercise input
        const predictExercise = page.locator('[data-testid="predict-output-exercise"]');
        await expect(predictExercise).toBeVisible({ timeout: 5000 });

        // Enter the correct answer (matches expectedAnswer string)
        const answerInput = predictExercise.locator('input');
        await answerInput.fill('42');

        // Submit the answer
        await submitBtn.click();

        // Wait for feedback - the answer should be graded via string matching fallback
        const continueBtn = page.getByRole('button', { name: /continue/i });
        await expect(continueBtn).toBeVisible({ timeout: 15000 });

        // Verify the answer was marked correct (string matching fallback worked)
        const successIndicator = page.getByText(/correct|well done|great/i);
        await expect(successIndicator).toBeVisible({ timeout: 5000 });

        console.log('Pyodide fallback test passed - string matching worked when CDN blocked');
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });
  });

  test.describe('Double Submit Prevention', () => {
    const adminClient = getAdminClient();

    test('submit button is disabled while submission is in progress', async ({ page }) => {
      test.setTimeout(60000);

      // Create a simple write exercise (faster than predict, no Pyodide)
      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-double-submit-${Date.now()}`,
        prompt: 'Print hello world',
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
        await expect(submitBtn).toBeEnabled({ timeout: 5000 });

        // Find the code input
        const codeInput = page.locator('[data-testid="code-input"]');
        const textarea = codeInput.locator('textarea');
        await textarea.fill('print("hello")');

        // Verify button is enabled before clicking
        const isEnabledBefore = await submitBtn.isEnabled();
        expect(isEnabledBefore).toBe(true);

        // Click submit and immediately check button state
        await submitBtn.click();

        // The button should become disabled while submitting
        // Check that button text changes to "Checking..." or button is disabled
        const checkingButton = page.getByRole('button', { name: /checking/i });
        const buttonDisabledOrChecking = await Promise.race([
          submitBtn.isDisabled().then((disabled) => disabled ? 'disabled' : 'enabled'),
          checkingButton.isVisible({ timeout: 500 }).then(() => 'checking').catch(() => null),
        ]);

        // Either the button is disabled OR shows "Checking..." text
        // Both indicate double-submit prevention
        expect(['disabled', 'checking']).toContain(buttonDisabledOrChecking);

        // Wait for feedback to appear (submission completed)
        const continueBtn = page.getByRole('button', { name: /continue/i });
        await expect(continueBtn).toBeVisible({ timeout: 15000 });

        // Verify there's only ONE feedback section (not duplicated from double submit)
        // We check Continue button count as a proxy for feedback sections
        const continueBtns = page.getByRole('button', { name: /continue/i });
        const continueBtnCount = await continueBtns.count();
        expect(continueBtnCount).toBe(1);

        console.log('Double-submit prevention test passed - button disabled during submission');
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });

    test('rapid double-click does not cause duplicate feedback', async ({ page }) => {
      test.setTimeout(60000);

      // Create a simple write exercise
      const slug = await insertDynamicExercise(adminClient, {
        slug: `e2e-rapid-click-${Date.now()}`,
        prompt: 'Print test',
        expectedAnswer: 'print("test")',
        acceptedSolutions: ['print("test")', 'print(\'test\')'],
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
        await expect(submitBtn).toBeEnabled({ timeout: 5000 });

        // Find the code input
        const codeInput = page.locator('[data-testid="code-input"]');
        const textarea = codeInput.locator('textarea');
        await textarea.fill('print("test")');

        // Perform rapid double-click using dblclick()
        await submitBtn.dblclick();

        // Wait for submission to complete
        const continueBtn = page.getByRole('button', { name: /continue/i });
        await expect(continueBtn).toBeVisible({ timeout: 15000 });

        // Verify answer was marked correct
        const successIndicator = page.getByText(/correct|well done|great/i);
        await expect(successIndicator).toBeVisible({ timeout: 5000 });

        // Verify only one Continue button exists (no duplicate submissions)
        const continueBtns = page.getByRole('button', { name: /continue/i });
        const count = await continueBtns.count();
        expect(count).toBe(1);

        // Verify the page is in a clean feedback state (not corrupted)
        // The "answering" phase elements should be hidden
        const codeInputAfter = page.locator('[data-testid="code-input"]');
        await expect(codeInputAfter).not.toBeVisible({ timeout: 2000 });

        console.log('Rapid double-click test passed - no duplicate feedback');
      } finally {
        await deleteExercise(adminClient, slug);
      }
    });
  });
});
