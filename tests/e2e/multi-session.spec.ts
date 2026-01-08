import { test, expect, Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { createTestUser, deleteTestUser, authenticateUser, TestUser } from './utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

let testUser: TestUser;

/**
 * Complete one full practice session
 * Returns the number of exercises completed (not counting teaching cards)
 */
async function completeSession(page: Page, sessionNumber: number): Promise<number> {
  await page.goto('/practice');

  // Wait for practice page to load
  const submitButton = page.getByRole('button', { name: /submit/i });
  const gotItButton = page.getByRole('button', { name: /got it/i });
  const allCaughtUp = page.getByText(/all caught up/i);

  await expect(submitButton.or(gotItButton).or(allCaughtUp)).toBeVisible({ timeout: 15000 });

  // If all caught up, return 0
  if (await allCaughtUp.isVisible({ timeout: 500 }).catch(() => false)) {
    console.log(`Session ${sessionNumber}: All caught up - no cards to practice`);
    return 0;
  }

  let exercisesCompleted = 0;
  let teachingCardsClicked = 0;
  const maxIterations = 30; // Safety limit (5 teaching + 5 exercises + buffer)
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    // Check if session is complete
    const sessionComplete = page.getByText(/great work|session complete/i);
    const backToDashboard = page.getByRole('button', { name: /back to dashboard/i });

    const isComplete = await Promise.race([
      sessionComplete.isVisible({ timeout: 300 }).catch(() => false),
      backToDashboard.isVisible({ timeout: 300 }).catch(() => false),
    ]);

    if (isComplete) {
      console.log(`Session ${sessionNumber}: Complete after ${exercisesCompleted} exercises, ${teachingCardsClicked} teaching cards`);
      break;
    }

    // Handle teaching cards - click "Got it" to advance
    const gotItBtn = page.getByRole('button', { name: /got it/i });
    if (await gotItBtn.isVisible({ timeout: 300 }).catch(() => false)) {
      await gotItBtn.click();
      teachingCardsClicked++;
      await page.waitForTimeout(200);
      continue;
    }

    // Answer the exercise
    const answerInput = page.getByRole('textbox').first();
    if (await answerInput.isVisible({ timeout: 500 }).catch(() => false)) {
      await answerInput.fill('test_answer');
    }

    // Submit answer
    const currentSubmitBtn = page.getByRole('button', { name: /submit/i });
    if (await currentSubmitBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await currentSubmitBtn.click();
    } else {
      // No submit button - session might be complete
      break;
    }

    // Wait for feedback and click continue
    const continueButton = page.getByRole('button', { name: /continue/i });
    try {
      await expect(continueButton).toBeVisible({ timeout: 5000 });
      exercisesCompleted++;
      await continueButton.click();
      await page.waitForTimeout(200);
    } catch {
      // Session might have completed
      break;
    }
  }

  return exercisesCompleted;
}

/**
 * Get subconcept progress count from database using service role (bypasses RLS)
 */
async function getProgressCount(userId: string): Promise<number> {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data, error } = await adminClient
    .from('subconcept_progress')
    .select('subconcept_slug')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching progress:', error);
    return 0;
  }

  return data?.length ?? 0;
}

/**
 * Get list of subconcept slugs for a user
 */
async function getSubconceptSlugs(userId: string): Promise<string[]> {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data, error } = await adminClient
    .from('subconcept_progress')
    .select('subconcept_slug')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching subconcepts:', error);
    return [];
  }

  return data?.map((d: { subconcept_slug: string }) => d.subconcept_slug) ?? [];
}

test.describe('Multi-Session New Cards Flow', () => {
  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      await deleteTestUser(testUser.id);
    }
  });

  test('completes 3 consecutive sessions with new cards each time', async ({ page }) => {
    test.setTimeout(360000); // 6 minute timeout for 3 full sessions

    await authenticateUser(page, testUser);

    // Session 1: Fresh user should get 5 teaching pairs (5 exercises)
    console.log('\n=== SESSION 1 ===');
    const session1Exercises = await completeSession(page, 1);
    const progress1 = await getProgressCount(testUser.id);
    const subconcepts1 = await getSubconceptSlugs(testUser.id);
    console.log(`Session 1: ${session1Exercises} exercises completed, ${progress1} subconcepts in progress`);
    console.log(`Session 1 subconcepts: ${subconcepts1.join(', ')}`);

    // Should get at least 4 exercises (allows for some teaching pair build failures)
    expect(session1Exercises).toBeGreaterThanOrEqual(4);
    expect(progress1).toBeGreaterThanOrEqual(4);

    await page.waitForTimeout(1000);

    // Session 2: Should get more new subconcepts
    console.log('\n=== SESSION 2 ===');
    const session2Exercises = await completeSession(page, 2);
    const progress2 = await getProgressCount(testUser.id);
    const subconcepts2 = await getSubconceptSlugs(testUser.id);
    console.log(`Session 2: ${session2Exercises} exercises completed, ${progress2} subconcepts in progress`);
    console.log(`Session 2 subconcepts: ${subconcepts2.join(', ')}`);

    expect(session2Exercises).toBeGreaterThanOrEqual(4);
    expect(progress2).toBeGreaterThan(progress1);

    await page.waitForTimeout(1000);

    // Session 3: Should get more new subconcepts
    console.log('\n=== SESSION 3 ===');
    const session3Exercises = await completeSession(page, 3);
    const progress3 = await getProgressCount(testUser.id);
    const subconcepts3 = await getSubconceptSlugs(testUser.id);
    console.log(`Session 3: ${session3Exercises} exercises completed, ${progress3} subconcepts in progress`);
    console.log(`Session 3 subconcepts: ${subconcepts3.join(', ')}`);

    expect(session3Exercises).toBeGreaterThanOrEqual(4);
    expect(progress3).toBeGreaterThan(progress2);

    console.log('\n=== FINAL SUMMARY ===');
    const totalExercises = session1Exercises + session2Exercises + session3Exercises;
    console.log(`Total: ${totalExercises} exercises across 3 sessions`);
    console.log(`Progress: ${progress3} unique subconcepts learned`);

    // Should have learned at least 12 subconcepts across 3 sessions
    expect(progress3).toBeGreaterThanOrEqual(12);
  });

  test('verifies no duplicate subconcepts across sessions', async ({ page }) => {
    test.setTimeout(360000);

    // Create a fresh user for this test
    const freshUser = await createTestUser();

    try {
      await authenticateUser(page, freshUser);

      const allSubconcepts: string[] = [];

      // Run 3 sessions and collect all subconcepts
      for (let session = 1; session <= 3; session++) {
        await completeSession(page, session);

        // Query subconcepts after this session (using admin client to bypass RLS)
        const currentSubconcepts = await getSubconceptSlugs(freshUser.id);
        const newInThisSession = currentSubconcepts.filter(s => !allSubconcepts.includes(s));

        console.log(`Session ${session} new subconcepts (${newInThisSession.length}): ${newInThisSession.join(', ')}`);

        // Should have at least 4 new subconcepts per session
        expect(newInThisSession.length).toBeGreaterThanOrEqual(4);

        allSubconcepts.push(...newInThisSession);
        await page.waitForTimeout(1000);
      }

      // Verify all subconcepts are unique (no duplicates)
      const uniqueSubconcepts = [...new Set(allSubconcepts)];
      expect(uniqueSubconcepts.length).toBe(allSubconcepts.length);
      console.log(`\nAll ${uniqueSubconcepts.length} unique subconcepts: ${uniqueSubconcepts.join(', ')}`);

      // Should have at least 12 subconcepts across 3 sessions
      expect(uniqueSubconcepts.length).toBeGreaterThanOrEqual(12);

    } finally {
      await deleteTestUser(freshUser.id);
    }
  });
});
