// tests/e2e/skin-driven-answers.spec.ts
// E2E tests to verify skin templating works correctly
// Critical: If skin vars aren't applied, users would see raw {{placeholder}} text

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  deleteTestUser,
  authenticateUser,
  TestUser,
  completeOneInteraction,
} from './utils';

/**
 * Helper to wait for practice page to be ready
 */
async function waitForPracticeReady(page: import('@playwright/test').Page) {
  const submitButton = page.getByRole('button', { name: /submit/i });
  const gotItButton = page.getByRole('button', { name: /got it/i });
  const allCaughtUp = page.getByText(/all caught up/i);

  await expect(submitButton.or(gotItButton).or(allCaughtUp)).toBeVisible({ timeout: 15000 });
}

/**
 * Helper to skip through any teaching cards
 */
async function skipTeachingCards(page: import('@playwright/test').Page, maxCards = 10) {
  const gotItButton = page.getByRole('button', { name: /got it/i });
  let cardsSkipped = 0;

  while (cardsSkipped < maxCards) {
    const isVisible = await gotItButton.isVisible({ timeout: 500 }).catch(() => false);
    if (!isVisible) break;

    await gotItButton.click();
    cardsSkipped++;
    await page.waitForTimeout(300);
  }

  return cardsSkipped;
}

/**
 * Common Mustache placeholders that indicate templating failure.
 * These are the skin variable names from SkinVars interface.
 */
const MUSTACHE_PLACEHOLDERS = [
  '{{list_name}}',
  '{{item_singular}}',
  '{{item_plural}}',
  '{{item_example}}',
  '{{item_examples}}',
  '{{record_key}}',
  '{{record_keys}}',
  '{{attr_key_1}}',
  '{{attr_key_2}}',
  '{{id_var}}',
  '{{filename}}',
  '{{filetype}}',
  '{{user_role}}',
  '{{status_var}}',
  '{{action_verb}}',
  '{{entity_name}}',
];

/**
 * Generator placeholders that should also be rendered
 */
const GENERATOR_PLACEHOLDERS = [
  '{{start}}',
  '{{end}}',
  '{{value}}',
  '{{index}}',
  '{{result}}',
  '{{list}}',
  '{{item}}',
];

test.describe('Skin-driven exercise rendering', () => {
  let testUser: TestUser;

  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      await deleteTestUser(testUser.id);
    }
  });

  test.describe('Template Substitution', () => {
    test('exercises do not show raw Mustache placeholders', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);
      await skipTeachingCards(page);

      // Get all visible text on the page
      const pageText = await page.textContent('body');

      // Verify no raw Mustache templates are visible (skin vars)
      for (const placeholder of MUSTACHE_PLACEHOLDERS) {
        expect(pageText, `Found raw placeholder: ${placeholder}`).not.toContain(placeholder);
      }

      // Also check generator placeholders
      for (const placeholder of GENERATOR_PLACEHOLDERS) {
        expect(pageText, `Found raw generator placeholder: ${placeholder}`).not.toContain(
          placeholder
        );
      }
    });

    test('exercise prompt does not contain unrendered templates', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);
      await skipTeachingCards(page);

      // Check specifically the exercise prompt element
      const promptElement = page.getByTestId('exercise-prompt');
      if (await promptElement.isVisible({ timeout: 2000 }).catch(() => false)) {
        const promptText = await promptElement.textContent();

        // Should not contain any raw Mustache syntax
        expect(promptText).not.toContain('{{');
        expect(promptText).not.toContain('}}');

        // Prompt should have actual content
        expect(promptText?.trim().length).toBeGreaterThan(0);
      }
    });

    test('code/template area shows rendered variable names', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);
      await skipTeachingCards(page);

      // Look for code/template area (pre, code, or specific data-testid elements)
      const codeArea = page.locator('pre, code, [data-testid="code-template"]');

      if (await codeArea.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        const codeText = await codeArea.first().textContent();

        // Should not have raw mustache templates
        expect(codeText).not.toContain('{{');
        expect(codeText).not.toContain('}}');
      }
    });
  });

  test.describe('Context Hint Rendering', () => {
    test('context hint does not show raw placeholders when visible', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);
      await skipTeachingCards(page);

      // Look for context hint element
      const contextHint = page.getByTestId('context-hint');

      // Context hint is optional - only shows when skin has context for the exercise
      if (await contextHint.isVisible({ timeout: 2000 }).catch(() => false)) {
        const hintText = await contextHint.textContent();

        // If hint exists, it should have actual content (not placeholder)
        expect(hintText).not.toContain('{{');
        expect(hintText).not.toContain('}}');
        expect(hintText?.trim().length).toBeGreaterThan(0);
      }
    });

    test('context hint contains meaningful text when present', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);
      await skipTeachingCards(page);

      const contextHint = page.getByTestId('context-hint');

      if (await contextHint.isVisible({ timeout: 2000 }).catch(() => false)) {
        const hintText = await contextHint.textContent();

        // Context should be a real sentence, not just variable values
        // Minimum length check ensures it's actual context text
        expect(hintText?.trim().length).toBeGreaterThan(10);
      }
    });
  });

  test.describe('Multi-Exercise Template Consistency', () => {
    test('templates remain properly rendered across multiple exercises', async ({ page }) => {
      test.setTimeout(120000); // 2 minute timeout

      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);
      await skipTeachingCards(page);

      let exercisesChecked = 0;
      const maxExercises = 5;
      const templateErrors: string[] = [];

      while (exercisesChecked < maxExercises) {
        // Check for session complete
        const sessionComplete = page.getByText(/session complete|great work|all caught up/i);
        if (await sessionComplete.isVisible({ timeout: 500 }).catch(() => false)) {
          break;
        }

        // Get page text and check for template issues
        const pageText = await page.textContent('body');
        if (pageText?.includes('{{') || pageText?.includes('}}')) {
          templateErrors.push(`Exercise ${exercisesChecked + 1}: Found raw template syntax`);
        }

        // Complete the exercise
        const result = await completeOneInteraction(page, 'test_answer');
        if (result === 'none') break;

        if (result === 'exercise') {
          exercisesChecked++;
        }

        await page.waitForTimeout(300);
      }

      // Report any template errors found
      expect(templateErrors, templateErrors.join('\n')).toHaveLength(0);

      console.log(`Checked ${exercisesChecked} exercises for template rendering`);
    });
  });

  test.describe('Input/Answer Area Rendering', () => {
    test('answer input placeholder does not contain templates', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);
      await skipTeachingCards(page);

      // Check answer input area
      const answerInput = page.getByPlaceholder(/type your answer|your answer/i);

      if (await answerInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        const placeholder = await answerInput.getAttribute('placeholder');

        // Placeholder should not contain template syntax
        expect(placeholder).not.toContain('{{');
        expect(placeholder).not.toContain('}}');
      }
    });

    test('fill-in exercise template shows rendered blanks', async ({ page }) => {
      test.setTimeout(120000);

      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);

      // Look through exercises to find a fill-in type
      let foundFillIn = false;
      let iterations = 0;

      while (!foundFillIn && iterations < 15) {
        await skipTeachingCards(page, 3);

        // Check for exercise type indicator
        const exerciseType = page.getByTestId('exercise-type');
        const typeText = await exerciseType.textContent().catch(() => null);

        if (typeText === 'fill-in') {
          foundFillIn = true;

          // Get the entire exercise card content
          const cardContent = await page.textContent('[class*="CardContent"], main');

          // Fill-in exercises should not have raw templates
          expect(cardContent).not.toContain('{{');
          expect(cardContent).not.toContain('}}');
        } else {
          // Complete this exercise to move to the next
          const result = await completeOneInteraction(page, 'test');
          if (result === 'none') break;
        }

        iterations++;
      }

      // Log whether we found and checked a fill-in exercise
      console.log(`Fill-in exercise ${foundFillIn ? 'found and checked' : 'not found in session'}`);
    });
  });

  test.describe('Dynamic Exercise Rendering', () => {
    test('dynamic exercises have all generator params rendered', async ({ page }) => {
      test.setTimeout(120000);

      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);

      let exercisesChecked = 0;
      const maxExercises = 10;

      while (exercisesChecked < maxExercises) {
        await skipTeachingCards(page, 3);

        // Check for session complete
        const sessionComplete = page.getByText(/session complete|great work|all caught up/i);
        if (await sessionComplete.isVisible({ timeout: 500 }).catch(() => false)) {
          break;
        }

        // Get prompt text
        const promptElement = page.getByTestId('exercise-prompt');
        if (await promptElement.isVisible({ timeout: 1000 }).catch(() => false)) {
          const promptText = await promptElement.textContent();

          // Should not contain any Mustache syntax
          expect(promptText, 'Prompt contains raw template').not.toContain('{{');

          // Check that prompt contains actual values (numbers for dynamic exercises)
          // This is a soft check - dynamic exercises often have numbers in prompts
          if (
            promptText?.includes('index') ||
            promptText?.includes('slice') ||
            promptText?.includes('character')
          ) {
            // Dynamic exercise prompts should have concrete number values
            const hasNumbers = /\d/.test(promptText || '');
            if (!hasNumbers) {
              console.warn(`Exercise prompt may be missing rendered values: ${promptText}`);
            }
          }
        }

        const result = await completeOneInteraction(page, 'test');
        if (result === 'none') break;

        if (result === 'exercise') {
          exercisesChecked++;
        }

        await page.waitForTimeout(200);
      }

      console.log(`Checked ${exercisesChecked} exercises for dynamic rendering`);
    });
  });

  test.describe('Error State Handling', () => {
    test('no undefined or null values rendered in exercise content', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);
      await skipTeachingCards(page);

      // Get all visible text content
      const pageText = await page.textContent('body');

      // Check for common rendering failures
      // These would indicate failed template substitution or missing data
      expect(pageText).not.toContain('undefined');
      expect(pageText).not.toContain('[object Object]');

      // Note: 'null' is tricky because it could be a valid word in some contexts
      // We check if it appears to be a rendering error pattern
      const nullPattern = /\bnull\b(?!\s*\)|null-|null_)/; // Avoid "null)" or null in identifiers
      const promptElement = page.getByTestId('exercise-prompt');
      if (await promptElement.isVisible({ timeout: 1000 }).catch(() => false)) {
        const promptText = await promptElement.textContent();
        expect(promptText).not.toMatch(nullPattern);
      }
    });
  });
});

test.describe('Skin-driven answers - Unauthenticated', () => {
  test('redirects to login when accessing practice without auth', async ({ page }) => {
    await page.goto('/practice');

    // Should redirect to home page or show login prompt
    await expect(page).toHaveURL(/\/(login|$)/, { timeout: 5000 });
  });
});
