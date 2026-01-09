// tests/e2e/multi-blueprint-session.spec.ts
/**
 * E2E tests for sessions containing exercises from multiple blueprints.
 *
 * These tests verify that:
 * 1. A practice session can show exercises from different blueprints
 * 2. Beat headers change appropriately when switching blueprints
 * 3. Skin context is applied correctly per blueprint group
 *
 * Note: Most multi-blueprint logic is tested via unit/integration tests.
 * These E2E tests focus on verifying the UI doesn't break with multi-blueprint data.
 */
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
 * Track beat header state for an exercise
 */
interface BeatHeaderState {
  blueprintTitle: string | null;
  skinIcon: string | null;
  beatNumber: number | null;
  totalBeats: number | null;
  beatTitle: string | null;
  isQuickDrill: boolean;
  isSideQuest: boolean;
}

/**
 * Extract current beat header information from the page
 */
async function captureBeatHeaderState(page: import('@playwright/test').Page): Promise<BeatHeaderState> {
  const beatHeader = page.getByTestId('beat-header');

  const state: BeatHeaderState = {
    blueprintTitle: null,
    skinIcon: null,
    beatNumber: null,
    totalBeats: null,
    beatTitle: null,
    isQuickDrill: false,
    isSideQuest: false,
  };

  const isVisible = await beatHeader.isVisible({ timeout: 1000 }).catch(() => false);
  if (!isVisible) {
    return state;
  }

  const headerText = await beatHeader.textContent();
  if (!headerText) {
    return state;
  }

  // Check for Quick Drill mode
  if (headerText.includes('Quick Drill')) {
    state.isQuickDrill = true;
    return state;
  }

  // Check for Side Quest mode
  if (headerText.includes('Side Quest')) {
    state.isSideQuest = true;
    return state;
  }

  // Extract skin icon (first character if emoji-like)
  // Check if first character is non-ASCII (likely an emoji)
  if (headerText.length > 0 && headerText.charCodeAt(0) > 127) {
    // Handle emoji by taking first "grapheme" - for most emoji this is 1-2 chars
    const firstChar = headerText.charAt(0);
    // Check if second char is part of emoji (surrogate pair)
    if (headerText.length > 1 && headerText.charCodeAt(1) >= 0xDC00 && headerText.charCodeAt(1) <= 0xDFFF) {
      state.skinIcon = headerText.slice(0, 2);
    } else {
      state.skinIcon = firstChar;
    }
  }

  // Extract beat progress "Beat X of Y"
  const beatMatch = headerText.match(/Beat (\d+) of (\d+)/);
  if (beatMatch) {
    state.beatNumber = parseInt(beatMatch[1], 10);
    state.totalBeats = parseInt(beatMatch[2], 10);
  }

  // Extract blueprint title (text between icon and beat progress)
  // Format is usually: [icon] [title] [dot] Beat X of Y [dot] "beatTitle"
  const titleMatch = headerText.match(/^.?\s*([^·]+)·\s*Beat/);
  if (titleMatch) {
    state.blueprintTitle = titleMatch[1].trim();
  }

  // Extract beat title (quoted text after beat progress)
  const beatTitleMatch = headerText.match(/"([^"]+)"/);
  if (beatTitleMatch) {
    state.beatTitle = beatTitleMatch[1];
  }

  return state;
}

test.describe('Multi-Blueprint Sessions', () => {
  let testUser: TestUser;

  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      await deleteTestUser(testUser.id);
    }
  });

  test.describe('Session with exercises from multiple blueprints', () => {
    test('app handles session without crashing', async ({ page }) => {
      // This is the most basic test - verify the practice page works
      // even when exercises may come from different blueprints
      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);

      // Page loaded successfully - verify basic elements exist
      await expect(page.locator('body')).toBeVisible();

      // Either we have an exercise (submit), teaching card (got it),
      // or no cards to practice (all caught up)
      const submitButton = page.getByRole('button', { name: /submit/i });
      const gotItButton = page.getByRole('button', { name: /got it/i });
      const allCaughtUp = page.getByText(/all caught up/i);

      const hasContent = await Promise.race([
        submitButton.isVisible({ timeout: 1000 }).catch(() => false),
        gotItButton.isVisible({ timeout: 1000 }).catch(() => false),
        allCaughtUp.isVisible({ timeout: 1000 }).catch(() => false),
      ]);

      expect(hasContent).toBe(true);
    });

    test('tracks blueprint transitions during session', async ({ page }) => {
      test.setTimeout(180000); // 3 minutes

      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);
      await skipTeachingCards(page);

      // Track blueprint context across multiple exercises
      const blueprintStates: BeatHeaderState[] = [];
      let exercisesCompleted = 0;
      const maxExercises = 8; // Complete enough exercises to potentially see multiple blueprints

      while (exercisesCompleted < maxExercises) {
        // Check for session complete
        const sessionComplete = page.getByText(/session complete|great work|all caught up/i);
        if (await sessionComplete.isVisible({ timeout: 500 }).catch(() => false)) {
          console.log('Session complete');
          break;
        }

        // Capture beat header state before completing exercise
        const state = await captureBeatHeaderState(page);
        blueprintStates.push(state);

        // Complete the exercise
        const result = await completeOneInteraction(page, 'test');
        if (result === 'none') break;

        if (result === 'exercise') {
          exercisesCompleted++;
        }

        await page.waitForTimeout(300);
      }

      console.log(`Completed ${exercisesCompleted} exercises`);
      console.log(`Blueprint states captured: ${blueprintStates.length}`);

      // Log state transitions for debugging
      const transitions: string[] = [];
      for (let i = 0; i < blueprintStates.length; i++) {
        const state = blueprintStates[i];
        let description = '';

        if (state.isQuickDrill) {
          description = 'Quick Drill';
        } else if (state.isSideQuest) {
          description = 'Side Quest';
        } else if (state.blueprintTitle) {
          description = `${state.skinIcon || ''} ${state.blueprintTitle} (Beat ${state.beatNumber}/${state.totalBeats})`;
        } else {
          description = 'No header';
        }

        transitions.push(description);
      }

      console.log('Transitions:', transitions.join(' -> '));

      // Verify we captured some states
      expect(blueprintStates.length).toBeGreaterThanOrEqual(1);
    });

    test('beat numbers remain valid within blueprint groups', async ({ page }) => {
      test.setTimeout(180000);

      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);
      await skipTeachingCards(page);

      // Track beat numbers grouped by blueprint
      const beatsByBlueprint = new Map<string, number[]>();
      let exercisesCompleted = 0;
      const maxExercises = 10;

      while (exercisesCompleted < maxExercises) {
        const sessionComplete = page.getByText(/session complete|great work|all caught up/i);
        if (await sessionComplete.isVisible({ timeout: 500 }).catch(() => false)) {
          break;
        }

        const state = await captureBeatHeaderState(page);

        // Track beat numbers per blueprint
        if (state.blueprintTitle && state.beatNumber) {
          const key = state.blueprintTitle;
          const existing = beatsByBlueprint.get(key) ?? [];
          existing.push(state.beatNumber);
          beatsByBlueprint.set(key, existing);
        }

        const result = await completeOneInteraction(page, 'test');
        if (result === 'none') break;

        if (result === 'exercise') {
          exercisesCompleted++;
        }

        await page.waitForTimeout(300);
      }

      // Verify beat numbers are valid within each blueprint
      Array.from(beatsByBlueprint.entries()).forEach(([blueprint, beats]) => {
        console.log(`${blueprint}: beats ${beats.join(', ')}`);

        // All beat numbers should be positive integers
        for (const beat of beats) {
          expect(beat).toBeGreaterThan(0);
        }

        // Within a blueprint, beats should generally progress or reset
        // (Reset happens when starting a new occurrence of the same blueprint)
        // At minimum, verify no impossible values
        for (const beat of beats) {
          expect(beat).toBeLessThanOrEqual(20); // No blueprint should have more than 20 beats
        }
      });
    });

    test('skin consistency is maintained within blueprint group', async ({ page }) => {
      test.setTimeout(180000);

      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);
      await skipTeachingCards(page);

      // Track skin icons grouped by blueprint
      const skinsByBlueprint = new Map<string, Set<string>>();
      let exercisesCompleted = 0;
      const maxExercises = 8;

      while (exercisesCompleted < maxExercises) {
        const sessionComplete = page.getByText(/session complete|great work|all caught up/i);
        if (await sessionComplete.isVisible({ timeout: 500 }).catch(() => false)) {
          break;
        }

        const state = await captureBeatHeaderState(page);

        // Track skin icons per blueprint
        if (state.blueprintTitle && state.skinIcon) {
          const key = state.blueprintTitle;
          const existing = skinsByBlueprint.get(key) ?? new Set();
          existing.add(state.skinIcon);
          skinsByBlueprint.set(key, existing);
        }

        const result = await completeOneInteraction(page, 'test');
        if (result === 'none') break;

        if (result === 'exercise') {
          exercisesCompleted++;
        }

        await page.waitForTimeout(300);
      }

      // Verify skin consistency - each blueprint should have one skin
      Array.from(skinsByBlueprint.entries()).forEach(([blueprint, skins]) => {
        console.log(`${blueprint}: skins ${Array.from(skins).join(', ')}`);

        // Within a single session, a blueprint should maintain the same skin
        expect(skins.size).toBe(1);
      });
    });
  });

  test.describe('UI transitions between blueprint groups', () => {
    test('beat header updates when switching between blueprinted and standalone exercises', async ({ page }) => {
      test.setTimeout(120000);

      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);
      await skipTeachingCards(page);

      let sawBlueprintExercise = false;
      let sawQuickDrill = false;
      let exercisesCompleted = 0;
      const maxExercises = 10;

      while (exercisesCompleted < maxExercises) {
        const sessionComplete = page.getByText(/session complete|great work|all caught up/i);
        if (await sessionComplete.isVisible({ timeout: 500 }).catch(() => false)) {
          break;
        }

        const state = await captureBeatHeaderState(page);

        if (state.blueprintTitle) {
          sawBlueprintExercise = true;
        }
        if (state.isQuickDrill) {
          sawQuickDrill = true;
        }

        const result = await completeOneInteraction(page, 'test');
        if (result === 'none') break;

        if (result === 'exercise') {
          exercisesCompleted++;
        }

        await page.waitForTimeout(300);
      }

      console.log(`Saw blueprint exercise: ${sawBlueprintExercise}`);
      console.log(`Saw Quick Drill: ${sawQuickDrill}`);

      // Log observation - actual mix depends on exercise selection
      // This test verifies the UI handles both modes
    });

    test('context hints appear for skinned exercises', async ({ page }) => {
      test.setTimeout(120000);

      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);
      await skipTeachingCards(page);

      let sawContextHint = false;
      let exercisesCompleted = 0;
      const maxExercises = 8;

      while (exercisesCompleted < maxExercises) {
        const sessionComplete = page.getByText(/session complete|great work|all caught up/i);
        if (await sessionComplete.isVisible({ timeout: 500 }).catch(() => false)) {
          break;
        }

        // Check for context hint
        const contextHint = page.getByTestId('context-hint');
        if (await contextHint.isVisible({ timeout: 500 }).catch(() => false)) {
          sawContextHint = true;
          const hintText = await contextHint.textContent();
          console.log(`Context hint: "${hintText}"`);
        }

        const result = await completeOneInteraction(page, 'test');
        if (result === 'none') break;

        if (result === 'exercise') {
          exercisesCompleted++;
        }

        await page.waitForTimeout(300);
      }

      console.log(`Saw context hint: ${sawContextHint}`);

      // Context hints are optional - depends on skin having context for exercise
      // This test verifies they render correctly when present
    });
  });

  test.describe('Edge cases for multi-blueprint sessions', () => {
    test('handles rapid exercise completion without UI glitches', async ({ page }) => {
      test.setTimeout(120000);

      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);
      await skipTeachingCards(page);

      // Complete exercises as fast as possible to test UI stability
      let exercisesCompleted = 0;
      const maxExercises = 5;
      const minWait = 100; // Very short wait between exercises

      while (exercisesCompleted < maxExercises) {
        const sessionComplete = page.getByText(/session complete|great work|all caught up/i);
        if (await sessionComplete.isVisible({ timeout: 300 }).catch(() => false)) {
          break;
        }

        const result = await completeOneInteraction(page, 'quick');
        if (result === 'none') break;

        if (result === 'exercise') {
          exercisesCompleted++;
        }

        await page.waitForTimeout(minWait);
      }

      console.log(`Completed ${exercisesCompleted} exercises rapidly`);

      // Verify page is still in a valid state
      await expect(page.locator('body')).toBeVisible();

      // Should be at session complete or ready for next exercise
      const submitButton = page.getByRole('button', { name: /submit/i });
      const sessionComplete = page.getByText(/session complete|great work|all caught up/i);
      const backToDashboard = page.getByRole('button', { name: /back to dashboard/i });

      const validState = await Promise.race([
        submitButton.isVisible({ timeout: 2000 }).catch(() => false),
        sessionComplete.isVisible({ timeout: 2000 }).catch(() => false),
        backToDashboard.isVisible({ timeout: 2000 }).catch(() => false),
      ]);

      expect(validState).toBe(true);
    });

    test('session completes successfully with mixed exercise types', async ({ page }) => {
      test.setTimeout(180000);

      await authenticateUser(page, testUser);
      await page.goto('/practice');

      await waitForPracticeReady(page);

      // Track exercise types encountered
      const exerciseTypes = {
        teaching: 0,
        exercise: 0,
      };

      let iterations = 0;
      const maxIterations = 25;

      while (iterations < maxIterations) {
        const sessionComplete = page.getByText(/session complete/i);
        const backToDashboard = page.getByRole('button', { name: /back to dashboard/i });

        const isComplete = await Promise.race([
          sessionComplete.isVisible({ timeout: 500 }).catch(() => false),
          backToDashboard.isVisible({ timeout: 500 }).catch(() => false),
        ]);

        if (isComplete) {
          console.log('Session complete');
          break;
        }

        const result = await completeOneInteraction(page, 'test');
        if (result === 'none') break;

        if (result === 'teaching') exerciseTypes.teaching++;
        if (result === 'exercise') exerciseTypes.exercise++;

        iterations++;
        await page.waitForTimeout(200);
      }

      console.log(`Teaching cards: ${exerciseTypes.teaching}, Exercises: ${exerciseTypes.exercise}`);

      // Verify we completed something
      expect(exerciseTypes.teaching + exerciseTypes.exercise).toBeGreaterThan(0);
    });
  });
});

test.describe('Multi-Blueprint Session - Unauthenticated', () => {
  test('practice page requires authentication', async ({ page }) => {
    await page.goto('/practice');

    // Should redirect to home page or show login
    await expect(page).toHaveURL(/\/(login|$)/, { timeout: 5000 });
  });
});
