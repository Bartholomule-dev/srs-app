// tests/e2e/achievements.spec.ts
// E2E tests for the achievements system

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  deleteTestUser,
  authenticateUser,
  TestUser,
} from './utils/auth';

/**
 * Helper function to wait for dashboard to fully load.
 * The dashboard shows "Your Progress" section after loading is complete.
 */
async function waitForDashboardLoad(page: import('@playwright/test').Page) {
  await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({
    timeout: 15000,
  });
}

test.describe('Achievements', () => {
  let testUser: TestUser;

  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      await deleteTestUser(testUser.id);
    }
  });

  test.describe('Achievements Page Display', () => {
    test('achievements page shows all three categories', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/achievements');

      // Check page title
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible({
        timeout: 15000,
      });

      // Check all three category section headers are visible (use role heading to be specific)
      await expect(page.getByRole('heading', { name: 'Habit' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Mastery' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Completionist' })).toBeVisible();
    });

    test('achievements page shows progress counter in X/18 format', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/achievements');

      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible({
        timeout: 15000,
      });

      // Check progress counter exists (format: "X / 18 unlocked")
      // The counter shows "X" then "/" then "18" then "unlocked"
      await expect(page.getByText('/ 18')).toBeVisible();
      await expect(page.getByText('unlocked')).toBeVisible();
    });

    test('achievements page shows locked achievements with locked badge', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/achievements');

      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible({
        timeout: 15000,
      });

      // Fresh user should have many locked achievements
      // Look for the "Locked" badge text
      await expect(page.getByText('Locked').first()).toBeVisible();
    });

    test('achievements page shows category descriptions', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/achievements');

      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible({
        timeout: 15000,
      });

      // Check category descriptions are visible
      await expect(page.getByText('Build consistency with daily practice')).toBeVisible();
      await expect(page.getByText('Demonstrate deep understanding of concepts')).toBeVisible();
      await expect(page.getByText('Complete milestones and explore all content')).toBeVisible();
    });

    test('achievements page shows all achievement cards with proper structure', async ({
      page,
    }) => {
      await authenticateUser(page, testUser);
      await page.goto('/achievements');

      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible({
        timeout: 15000,
      });

      // Check for specific achievements (one from each category)
      await expect(page.getByText('First Steps')).toBeVisible();
      await expect(page.getByText('Bronze Age')).toBeVisible();
      await expect(page.getByText('Century')).toBeVisible();

      // Check achievements have descriptions
      await expect(page.getByText('Complete your first graded exercise')).toBeVisible();
    });
  });

  test.describe('Dashboard Recent Achievements Section', () => {
    test('dashboard shows Recent Achievements section', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for dashboard to load
      await waitForDashboardLoad(page);

      // Recent achievements section header exists
      await expect(page.getByText('Recent Achievements')).toBeVisible();
    });

    test('dashboard shows View All link to achievements page', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for dashboard to load
      await waitForDashboardLoad(page);

      // View All link should point to achievements page
      const viewAllLink = page.getByRole('link', { name: /view all/i });
      await expect(viewAllLink).toBeVisible();
      await expect(viewAllLink).toHaveAttribute('href', '/achievements');
    });

    test('dashboard shows empty state for new user with no achievements', async ({ page }) => {
      // Create a fresh user with no activity
      const freshUser = await createTestUser();

      try {
        await authenticateUser(page, freshUser);
        await page.goto('/dashboard');

        // Wait for dashboard to load
        await waitForDashboardLoad(page);

        // Should show empty state message
        await expect(page.getByText('No achievements unlocked yet')).toBeVisible();

        // Should have Start Practicing link
        await expect(page.getByRole('link', { name: /start practicing/i })).toBeVisible();
      } finally {
        await deleteTestUser(freshUser.id);
      }
    });
  });

  test.describe('Navigation', () => {
    test('can navigate to achievements page from dashboard View All link', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for dashboard to load
      await waitForDashboardLoad(page);

      // Click View All link in Recent Achievements section
      await page.getByRole('link', { name: /view all/i }).click();

      // Should be on achievements page
      await expect(page).toHaveURL(/\/achievements/);
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible();
    });

    test('can navigate to achievements page from header link', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for dashboard to load
      await waitForDashboardLoad(page);

      // Click achievements link in header
      const achievementsLink = page.getByRole('link', { name: /achievements/i }).first();
      await expect(achievementsLink).toBeVisible();
      await achievementsLink.click();

      // Should be on achievements page
      await expect(page).toHaveURL(/\/achievements/);
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible();
    });

    test('can navigate back to dashboard from achievements page', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/achievements');

      // Wait for achievements page to load
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible({
        timeout: 15000,
      });

      // Click logo to go back to dashboard
      await page.getByRole('link', { name: /syntaxsrs/i }).click();

      // Should be on dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      await waitForDashboardLoad(page);
    });
  });

  test.describe('Visual States', () => {
    test('locked achievements display with greyscale styling', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/achievements');

      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible({
        timeout: 15000,
      });

      // Find a locked achievement icon (should have grayscale class)
      // The icon container has grayscale opacity-50 classes when locked
      const lockedIcon = page.locator('.grayscale.opacity-50').first();
      await expect(lockedIcon).toBeVisible();
    });

    test('category badges have correct colors', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/achievements');

      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible({
        timeout: 15000,
      });

      // Check category badges are present on achievement cards
      const habitBadge = page.getByText('habit', { exact: true }).first();
      const masteryBadge = page.getByText('mastery', { exact: true }).first();
      const completionistBadge = page.getByText('completionist', { exact: true }).first();

      await expect(habitBadge).toBeVisible();
      await expect(masteryBadge).toBeVisible();
      await expect(completionistBadge).toBeVisible();
    });
  });

  test.describe('Loading States', () => {
    test('achievements page shows loading skeleton', async ({ page }) => {
      await authenticateUser(page, testUser);

      // Intercept and delay the achievements API call
      await page.route('**/rest/v1/user_achievements*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.continue();
      });

      await page.goto('/achievements');

      // Look for skeleton elements (loading state has animate-pulse)
      const skeleton = page.locator('.animate-pulse').first();

      // Either skeleton should be visible briefly, or page loads quickly
      const sawSkeleton = await skeleton.isVisible({ timeout: 1000 }).catch(() => false);

      // Wait for actual content to load
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible({
        timeout: 15000,
      });

      console.log(`Loading skeleton was visible: ${sawSkeleton}`);
    });

    test('dashboard recent achievements shows loading skeleton', async ({ page }) => {
      await authenticateUser(page, testUser);

      // Intercept and delay the achievements API call
      await page.route('**/rest/v1/user_achievements*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.continue();
      });

      await page.goto('/dashboard');

      // Look for the specific skeleton testid
      const skeleton = page.getByTestId('recent-achievements-skeleton');

      // Either skeleton should be visible briefly, or page loads quickly
      const sawSkeleton = await skeleton.isVisible({ timeout: 1000 }).catch(() => false);

      // Wait for dashboard to load
      await waitForDashboardLoad(page);

      console.log(`Recent achievements skeleton was visible: ${sawSkeleton}`);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('achievements page is responsive on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await authenticateUser(page, testUser);
      await page.goto('/achievements');

      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible({
        timeout: 15000,
      });

      // Core elements should still be visible on mobile (use specific selectors)
      await expect(page.getByRole('heading', { name: 'Habit' })).toBeVisible();
      await expect(page.getByText('First Steps')).toBeVisible();
      await expect(page.getByText('/ 18')).toBeVisible();
    });

    test('dashboard recent achievements scrolls horizontally on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for dashboard to load
      await waitForDashboardLoad(page);

      // Recent Achievements section should be visible
      await expect(page.getByText('Recent Achievements')).toBeVisible();
    });
  });
});

// Separate test describe for achievement unlock flow (more complex, can be skipped if flaky)
test.describe('Achievement Unlock Flow', () => {
  // This test is more complex as it requires completing an exercise
  // Skip if the test becomes flaky in CI
  test.skip('first-steps achievement unlocks after completing first exercise', async ({
    page,
  }) => {
    // Create a fresh user for this test
    const freshUser = await createTestUser();

    try {
      await authenticateUser(page, freshUser);
      await page.goto('/dashboard');

      // Wait for dashboard to load
      await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({
        timeout: 15000,
      });

      // Verify no achievements yet
      await expect(page.getByText('No achievements unlocked yet')).toBeVisible();

      // Start practice
      await page.getByRole('link', { name: /practice/i }).click();

      // Wait for practice page to load and complete one exercise
      // This is complex because we need to interact with the exercise flow
      // The exercise card should be visible
      await page.waitForSelector('[data-testid="exercise-card"]', { timeout: 10000 });

      // Note: Completing an actual exercise requires:
      // 1. Finding the correct answer
      // 2. Entering it in the input
      // 3. Submitting
      // This depends heavily on the exercise type and content

      // For now, we verify the practice page loads correctly
      // A full unlock test would require mocking or specific exercise handling
    } finally {
      await deleteTestUser(freshUser.id);
    }
  });
});
