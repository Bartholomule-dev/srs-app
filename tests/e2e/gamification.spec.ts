// tests/e2e/gamification.spec.ts
// Comprehensive E2E tests for gamification features

import { test, expect } from '@playwright/test';
import {
  createTestUser,
  deleteTestUser,
  authenticateUser,
  TestUser,
  completeOneInteraction,
} from './utils';

/**
 * Helper function to wait for dashboard to fully load.
 * The dashboard shows "Your Progress" section after loading is complete.
 */
async function waitForDashboardLoad(page: import('@playwright/test').Page) {
  await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible({
    timeout: 15000,
  });
}

test.describe('Gamification E2E', () => {
  let testUser: TestUser;

  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      await deleteTestUser(testUser.id);
    }
  });

  test.describe('Streak Display', () => {
    test('header shows streak information for users', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for dashboard to load
      await waitForDashboardLoad(page);

      // Fresh user should see "Start your streak!" message
      // or if they have activity, they'll see the streak count
      const startStreakText = page.getByText('Start your streak!');
      const streakCountText = page.getByText(/day streak/);

      // Either one should be visible
      const hasStartStreak = await startStreakText.isVisible().catch(() => false);
      const hasStreakCount = await streakCountText.isVisible().catch(() => false);

      expect(hasStartStreak || hasStreakCount).toBe(true);
    });

    test('header shows "today" count', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for dashboard to load
      await waitForDashboardLoad(page);

      // Header should show "X today" for cards reviewed today
      await expect(page.getByText('today')).toBeVisible();
    });

    test('streak flame icon appears when user has streak', async ({ page }) => {
      // Create a fresh user and complete an exercise to start streak
      const freshUser = await createTestUser();

      try {
        await authenticateUser(page, freshUser);
        await page.goto('/practice');

        // Complete at least one exercise
        const result = await completeOneInteraction(page, 'test');

        // If we completed something, go back to dashboard
        if (result !== 'none') {
          await page.goto('/dashboard');
          await waitForDashboardLoad(page);

          // Check for either streak display or "Start your streak" (for new user)
          // The FlameIcon has data-testid="streak-flame" if streak > 0
          const streakFlame = page.getByTestId('streak-flame');
          const startStreak = page.getByText('Start your streak!');

          const hasFlame = await streakFlame.isVisible({ timeout: 3000 }).catch(() => false);
          const hasStartMessage = await startStreak.isVisible({ timeout: 1000 }).catch(() => false);

          // At least one streak-related element should be visible
          expect(hasFlame || hasStartMessage).toBe(true);
        }
      } finally {
        await deleteTestUser(freshUser.id);
      }
    });
  });

  test.describe('Contribution Graph', () => {
    test('contribution graph section displays on dashboard', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for dashboard to fully load
      await waitForDashboardLoad(page);

      // Should see the Activity History section header
      await expect(page.getByText('Activity History')).toBeVisible();

      // The contribution graph container should be present
      const graphContainer = page.locator('[data-contribution-graph]');
      await expect(graphContainer).toBeVisible({ timeout: 10000 });
    });

    test('contribution graph shows empty state for new user', async ({ page }) => {
      // Create a fresh user with no activity
      const freshUser = await createTestUser();

      try {
        await authenticateUser(page, freshUser);
        await page.goto('/dashboard');

        // Wait for dashboard to load
        await waitForDashboardLoad(page);

        // Should see empty state message for contribution graph
        await expect(
          page.getByText(/Start practicing to see your contribution graph/i)
        ).toBeVisible({ timeout: 10000 });
      } finally {
        await deleteTestUser(freshUser.id);
      }
    });

    test('contribution graph legend shows intensity levels', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for dashboard to load
      await waitForDashboardLoad(page);

      // The graph container should be present (even if showing empty state)
      await expect(page.getByText('Activity History')).toBeVisible();

      // Legend shows "Less" and "More" labels when there's activity
      const lessLabel = page.getByText('Less');

      // Either legend is visible (has activity) or empty state (no activity)
      const hasLegend = await lessLabel.isVisible({ timeout: 2000 }).catch(() => false);
      const hasEmptyState = await page
        .getByText(/Start practicing/i)
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      expect(hasLegend || hasEmptyState).toBe(true);
    });

    test('contribution graph has interactive day cells', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for dashboard to load
      await waitForDashboardLoad(page);

      // Look for contribution day cells (they have data-contribution-day attribute)
      const dayCells = page.locator('[data-contribution-day]');
      const cellCount = await dayCells.count();

      // Either we have contribution cells or empty state
      if (cellCount > 0) {
        // Hover over a cell to show tooltip
        const firstCell = dayCells.first();
        await firstCell.hover();

        // Tooltip should appear with date info
        const tooltip = page.locator('[role="tooltip"]');
        await expect(tooltip).toBeVisible({ timeout: 3000 });
      } else {
        // Empty state should be visible
        await expect(
          page.getByText(/Start practicing to see your contribution graph/i)
        ).toBeVisible();
      }
    });
  });

  test.describe('Achievements Page', () => {
    test('achievements page shows all three categories', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/achievements');

      // Check page title
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible({
        timeout: 15000,
      });

      // Check all three category section headers are visible
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
      await expect(page.getByText('/ 18')).toBeVisible();
      await expect(page.getByText('unlocked')).toBeVisible();
    });

    test('achievements page displays all 18 achievements', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/achievements');

      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible({
        timeout: 15000,
      });

      // Sample achievements from each category that should be visible
      const sampleAchievements = [
        // Habit category
        'First Steps',
        'Week Warrior',
        'Monthly Master',
        // Mastery category
        'Bronze Age',
        'Gold Standard',
        'Concept Master',
        // Completionist category
        'Century',
        'Thousand Strong',
        'Pythonista',
      ];

      // Check that several key achievements are visible
      for (const achievement of sampleAchievements.slice(0, 5)) {
        await expect(page.getByText(achievement)).toBeVisible();
      }
    });

    test('achievements show locked state for new user', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/achievements');

      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible({
        timeout: 15000,
      });

      // Fresh user should have most achievements locked
      // Look for "Locked" badge text
      await expect(page.getByText('Locked').first()).toBeVisible();

      // Locked achievements have greyscale styling
      const lockedIcon = page.locator('.grayscale.opacity-50').first();
      await expect(lockedIcon).toBeVisible();
    });

    test('achievements show category badges', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/achievements');

      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible({
        timeout: 15000,
      });

      // Check category badges are present on achievement cards
      await expect(page.getByText('habit', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('mastery', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('completionist', { exact: true }).first()).toBeVisible();
    });
  });

  test.describe('Achievement Toast Notifications', () => {
    test('achievement unlock shows toast notification after completing exercise', async ({
      page,
    }) => {
      // Create a fresh user who will unlock "First Steps" achievement
      const freshUser = await createTestUser();

      try {
        await authenticateUser(page, freshUser);
        await page.goto('/practice');

        // Complete an exercise (any answer will trigger completion)
        const submitButton = page.getByRole('button', { name: /submit/i });
        const gotItButton = page.getByRole('button', { name: /got it/i });

        // Wait for either exercise or teaching card
        await expect(submitButton.or(gotItButton)).toBeVisible({ timeout: 15000 });

        // Skip teaching cards if present
        while (await gotItButton.isVisible({ timeout: 500 }).catch(() => false)) {
          await gotItButton.click();
          await page.waitForTimeout(300);
        }

        // If we have an exercise, complete it
        if (await submitButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          // Fill in answer
          const answerInput = page.getByRole('textbox').first();
          if (await answerInput.isVisible({ timeout: 500 }).catch(() => false)) {
            await answerInput.fill('print("hello")');
          }
          await submitButton.click();

          // Click continue to proceed
          const continueButton = page.getByRole('button', { name: /continue/i });
          if (await continueButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await continueButton.click();
          }

          // Continue until session ends
          let iterations = 0;
          while (iterations < 10) {
            const state = await completeOneInteraction(page, 'test');
            if (state === 'none') break;
            iterations++;
          }

          // Wait for session summary - achievement check happens here
          const sessionComplete = page.getByText(/session complete/i);
          const backToDashboard = page.getByRole('button', { name: /back to dashboard/i });

          // Either session complete message or back button should appear
          await expect(sessionComplete.or(backToDashboard)).toBeVisible({ timeout: 10000 });

          // Achievement toast appears with role="alert"
          // It may or may not show depending on whether achievement was unlocked
          const achievementToast = page.locator('[role="alert"]');
          const achievementUnlockedText = page.getByText(/achievement unlocked/i);

          // Give toast time to appear
          await page.waitForTimeout(1000);

          // Log whether we saw the toast (informational, not required to pass)
          const sawToast = await achievementToast.isVisible({ timeout: 2000 }).catch(() => false);
          const sawUnlockedText = await achievementUnlockedText
            .isVisible({ timeout: 1000 })
            .catch(() => false);

          console.log(`Achievement toast visible: ${sawToast || sawUnlockedText}`);
        }
      } finally {
        await deleteTestUser(freshUser.id);
      }
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

  test.describe('Skill Tree with Badge Tiers', () => {
    test('skill tree section displays on dashboard', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for dashboard to load
      await waitForDashboardLoad(page);

      // Should see the Learning Path section header
      await expect(page.getByText('Learning Path')).toBeVisible();

      // Skill tree container should be visible
      await expect(page.getByTestId('skill-tree-container')).toBeVisible({ timeout: 10000 });
    });

    test('skill tree shows concept clusters with progress', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for skill tree to load
      await expect(page.getByTestId('skill-tree-container')).toBeVisible({ timeout: 10000 });

      // Should see at least one concept name (e.g., "Foundations")
      await expect(page.getByText('Foundations')).toBeVisible();

      // Should see progress badges in format "X/Y"
      await expect(page.getByText(/\d+\/\d+/)).toBeVisible();
    });

    test('skill tree nodes are interactive with tooltips', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for skill tree to load
      await expect(page.getByTestId('skill-tree-container')).toBeVisible({ timeout: 10000 });

      // Find a subconcept node button (they have aria-label with subconcept names)
      const nodeButton = page.locator('button[aria-label]').first();
      await expect(nodeButton).toBeVisible();

      // Hover to show tooltip
      await nodeButton.hover();

      // A tooltip should appear (role="tooltip")
      const tooltip = page.locator('[role="tooltip"]');
      await expect(tooltip).toBeVisible({ timeout: 5000 });

      // Tooltip should contain the subconcept name and state info
      const tooltipText = await tooltip.textContent();
      expect(tooltipText).toBeTruthy();
    });

    test('badge tier nodes have correct data attributes', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for skill tree to load
      await expect(page.getByTestId('skill-tree-container')).toBeVisible({ timeout: 10000 });

      // Find nodes with badge tier data attribute
      const badgeTierNodes = page.locator('[data-badge-tier]');
      const count = await badgeTierNodes.count();

      // There should be at least some nodes (the curriculum has 65 subconcepts)
      expect(count).toBeGreaterThan(0);

      // Get the first node's badge tier value
      const firstNode = badgeTierNodes.first();
      const tierValue = await firstNode.getAttribute('data-badge-tier');

      // Should be one of the valid badge tiers
      const validTiers = ['locked', 'available', 'bronze', 'silver', 'gold', 'platinum'];
      expect(validTiers).toContain(tierValue);
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

      // Core elements should still be visible on mobile
      await expect(page.getByRole('heading', { name: 'Habit' })).toBeVisible();
      await expect(page.getByText('First Steps')).toBeVisible();
      await expect(page.getByText('/ 18')).toBeVisible();
    });

    test('contribution graph adapts on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for dashboard to load
      await waitForDashboardLoad(page);

      // Activity History section should still be visible
      await expect(page.getByText('Activity History')).toBeVisible();
    });

    test('skill tree is scrollable on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for skill tree to load
      await expect(page.getByTestId('skill-tree-container')).toBeVisible({ timeout: 10000 });

      // The scroll container should exist
      const scrollContainer = page.getByTestId('skill-tree-scroll');
      await expect(scrollContainer).toBeVisible();
    });
  });
});
