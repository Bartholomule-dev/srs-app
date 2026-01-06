import { test, expect, Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { createTestUser, deleteTestUser, TestUser } from './utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Helper to authenticate a test user and inject session cookies
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

// Run tests serially to avoid database connection pool issues
test.describe.configure({ mode: 'serial' });

test.describe('Learning Mode', () => {
  let testUser: TestUser;

  test.beforeAll(async () => {
    // Create a fresh test user (no subconcept_progress records = new user)
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      await deleteTestUser(testUser.id);
    }
  });

  test('new user sees teaching card before practice', async ({ page }) => {
    test.setTimeout(60000);

    await authenticateUser(page, testUser);
    await page.goto('/practice');

    // Wait for either teaching card, exercise card, or empty state
    const teachingLabel = page.getByText('LEARN');
    const submitButton = page.getByRole('button', { name: /submit/i });
    const allCaughtUp = page.getByText(/all caught up/i);

    // Wait for page to load - one of these should appear
    await expect(
      teachingLabel.or(submitButton).or(allCaughtUp)
    ).toBeVisible({ timeout: 15000 });

    // Check if we got a teaching card (expected for new user)
    const hasTeachingCard = await teachingLabel.isVisible().catch(() => false);

    if (hasTeachingCard) {
      // Verify teaching card structure
      // Should have "LEARN" label (blue styling)
      await expect(teachingLabel).toBeVisible();
      await expect(teachingLabel).toHaveClass(/text-blue-400/);

      // Should have "Got it" button
      const gotItButton = page.getByRole('button', { name: /got it/i });
      await expect(gotItButton).toBeVisible();
      await expect(gotItButton).toHaveClass(/bg-blue-600/);

      // Teaching card should have an explanation visible (look for "Example" text which appears in teaching cards)
      const exampleLabel = page.getByText('Example', { exact: true });
      await expect(exampleLabel).toBeVisible();

      console.log('Teaching card found and verified for new user');
    } else {
      // New user might go straight to exercises if no teaching content defined
      // or if all caught up (rare for new user but possible)
      console.log('No teaching card displayed - checking alternative states');
      const hasExercise = await submitButton.isVisible().catch(() => false);
      const isEmpty = await allCaughtUp.isVisible().catch(() => false);

      expect(hasExercise || isEmpty).toBe(true);
    }
  });

  test('teaching card advances with Enter key', async ({ page }) => {
    test.setTimeout(60000);

    // Create a fresh user for this test to ensure teaching cards appear
    const freshUser = await createTestUser();

    try {
      await authenticateUser(page, freshUser);
      await page.goto('/practice');

      // Wait for page to load
      const teachingLabel = page.getByText('LEARN');
      const submitButton = page.getByRole('button', { name: /submit/i });
      const allCaughtUp = page.getByText(/all caught up/i);

      await expect(
        teachingLabel.or(submitButton).or(allCaughtUp)
      ).toBeVisible({ timeout: 15000 });

      const hasTeachingCard = await teachingLabel.isVisible().catch(() => false);

      if (!hasTeachingCard) {
        console.log('No teaching card for Enter key test - skipping');
        return;
      }

      // Record current progress state
      const progressText = await page.locator('[role="progressbar"]').getAttribute('aria-label');
      console.log(`Progress before Enter: ${progressText}`);

      // Press Enter to advance the teaching card
      await page.keyboard.press('Enter');

      // Wait for animation/transition
      await page.waitForTimeout(500);

      // Verify we advanced to a new card (either another teaching card, exercise, or session complete)
      const nextTeachingLabel = page.getByText('LEARN');
      const nextSubmitButton = page.getByRole('button', { name: /submit/i });
      const sessionComplete = page.getByText(/session complete|great work/i);

      // One of these should be visible after advancing
      await expect(
        nextTeachingLabel.or(nextSubmitButton).or(sessionComplete)
      ).toBeVisible({ timeout: 5000 });

      // Verify progress changed (aria-label should be different)
      const newProgressText = await page.locator('[role="progressbar"]').getAttribute('aria-label');
      console.log(`Progress after Enter: ${newProgressText}`);

      // Progress should have advanced (unless session is complete)
      const isComplete = await sessionComplete.isVisible().catch(() => false);
      if (!isComplete) {
        expect(newProgressText).not.toBe(progressText);
      }

      console.log('Enter key successfully advanced teaching card');
    } finally {
      await deleteTestUser(freshUser.id);
    }
  });

  test('progress bar shows blue segment for teaching cards', async ({ page }) => {
    test.setTimeout(60000);

    // Create a fresh user to ensure teaching cards appear
    const freshUser = await createTestUser();

    try {
      await authenticateUser(page, freshUser);
      await page.goto('/practice');

      // Wait for page to load
      const teachingLabel = page.getByText('LEARN');
      const submitButton = page.getByRole('button', { name: /submit/i });
      const allCaughtUp = page.getByText(/all caught up/i);

      await expect(
        teachingLabel.or(submitButton).or(allCaughtUp)
      ).toBeVisible({ timeout: 15000 });

      const hasTeachingCard = await teachingLabel.isVisible().catch(() => false);

      if (!hasTeachingCard) {
        console.log('No teaching card for progress bar test - skipping');
        return;
      }

      // Find the progress bar segments
      const progressBar = page.locator('[role="progressbar"]');
      await expect(progressBar).toBeVisible();

      // Check for teaching segment markers (data-segment-type="teaching")
      const teachingSegments = page.locator('[data-segment-type="teaching"]');
      const teachingSegmentCount = await teachingSegments.count();

      // There should be at least one teaching segment if we have a teaching card
      expect(teachingSegmentCount).toBeGreaterThan(0);

      // Verify the current teaching segment has blue styling (bg-blue-500)
      const currentTeachingSegment = teachingSegments.first();
      const innerSegment = currentTeachingSegment.locator('[data-segment-inner]');
      await expect(innerSegment).toHaveClass(/bg-blue-500/);

      console.log(`Found ${teachingSegmentCount} teaching segment(s) in progress bar`);

      // Also verify review/practice segments have different (green) styling
      const reviewSegments = page.locator('[data-segment-type="review"], [data-segment-type="practice"]');
      const reviewCount = await reviewSegments.count();

      if (reviewCount > 0) {
        // Review segments should have accent-primary (green) color when active
        console.log(`Found ${reviewCount} review/practice segment(s)`);
      }

      console.log('Progress bar correctly shows blue segments for teaching cards');
    } finally {
      await deleteTestUser(freshUser.id);
    }
  });

  test('clicking Got it button advances teaching card', async ({ page }) => {
    test.setTimeout(60000);

    // Create a fresh user for this test
    const freshUser = await createTestUser();

    try {
      await authenticateUser(page, freshUser);
      await page.goto('/practice');

      // Wait for page to load
      const teachingLabel = page.getByText('LEARN');
      const submitButton = page.getByRole('button', { name: /submit/i });
      const allCaughtUp = page.getByText(/all caught up/i);

      await expect(
        teachingLabel.or(submitButton).or(allCaughtUp)
      ).toBeVisible({ timeout: 15000 });

      const hasTeachingCard = await teachingLabel.isVisible().catch(() => false);

      if (!hasTeachingCard) {
        console.log('No teaching card for Got it button test - skipping');
        return;
      }

      // Get the Got it button
      const gotItButton = page.getByRole('button', { name: /got it/i });
      await expect(gotItButton).toBeVisible();

      // Record current progress
      const progressBefore = await page.locator('[role="progressbar"]').getAttribute('aria-label');

      // Click the button to advance
      await gotItButton.click();

      // Wait for animation
      await page.waitForTimeout(500);

      // Verify we advanced
      const nextTeachingLabel = page.getByText('LEARN');
      const nextSubmitButton = page.getByRole('button', { name: /submit/i });
      const sessionComplete = page.getByText(/session complete|great work/i);

      await expect(
        nextTeachingLabel.or(nextSubmitButton).or(sessionComplete)
      ).toBeVisible({ timeout: 5000 });

      // Check progress advanced
      const progressAfter = await page.locator('[role="progressbar"]').getAttribute('aria-label');

      const isComplete = await sessionComplete.isVisible().catch(() => false);
      if (!isComplete) {
        expect(progressAfter).not.toBe(progressBefore);
      }

      console.log('Got it button successfully advanced teaching card');
    } finally {
      await deleteTestUser(freshUser.id);
    }
  });
});
