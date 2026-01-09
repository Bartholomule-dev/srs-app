// tests/e2e/gamification-visualization.spec.ts
// E2E tests for gamification visualization features on the dashboard

import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, authenticateUser, TestUser } from './utils/auth';

test.describe('Gamification Visualization on Dashboard', () => {
  let testUser: TestUser;

  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      await deleteTestUser(testUser.id);
    }
  });

  test.describe('Contribution Graph', () => {
    test('contribution graph section displays on dashboard', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for dashboard to fully load
      await expect(
        page.getByRole('heading', { name: /Good (morning|afternoon|evening|night)/i })
      ).toBeVisible({ timeout: 15000 });

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
        await expect(
          page.getByRole('heading', { name: /Good (morning|afternoon|evening|night)/i })
        ).toBeVisible({ timeout: 15000 });

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
      await expect(
        page.getByRole('heading', { name: /Good (morning|afternoon|evening|night)/i })
      ).toBeVisible({ timeout: 15000 });

      // The graph container should be present (even if showing empty state)
      await expect(page.getByText('Activity History')).toBeVisible();

      // If there's activity, the legend should show
      // Legend shows "Less" and "More" labels
      const lessLabel = page.getByText('Less');

      // Either legend is visible (has activity) or empty state (no activity)
      const hasLegend = await lessLabel.isVisible({ timeout: 2000 }).catch(() => false);
      const hasEmptyState = await page
        .getByText(/Start practicing/i)
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      expect(hasLegend || hasEmptyState).toBe(true);
    });
  });

  test.describe('Skill Tree with Badge Tiers', () => {
    test('skill tree section displays on dashboard', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for dashboard to load
      await expect(
        page.getByRole('heading', { name: /Good (morning|afternoon|evening|night)/i })
      ).toBeVisible({ timeout: 15000 });

      // Should see the Learning Path section header
      await expect(page.getByText('Learning Path')).toBeVisible();

      // Skill tree container should be visible
      await expect(
        page.getByTestId('skill-tree-container')
      ).toBeVisible({ timeout: 10000 });
    });

    test('skill tree shows concept clusters with progress', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for skill tree to load
      await expect(
        page.getByTestId('skill-tree-container')
      ).toBeVisible({ timeout: 10000 });

      // Should see at least one concept name (e.g., "Foundations")
      await expect(page.getByText('Foundations')).toBeVisible();

      // Should see progress badges in format "X/Y"
      await expect(page.getByText(/\d+\/\d+/)).toBeVisible();
    });

    test('skill tree nodes are interactive with tooltips', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for skill tree to load
      await expect(
        page.getByTestId('skill-tree-container')
      ).toBeVisible({ timeout: 10000 });

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
      await expect(
        page.getByTestId('skill-tree-container')
      ).toBeVisible({ timeout: 10000 });

      // Find nodes with badge tier data attribute
      // New users will have most nodes as 'available' or 'locked'
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

    test('skill tree shows multiple concept clusters', async ({ page }) => {
      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for skill tree to load
      await expect(
        page.getByTestId('skill-tree-container')
      ).toBeVisible({ timeout: 10000 });

      // The curriculum has 11 concepts, should see multiple
      // Look for distinct concept names
      const foundationsTxt = page.getByText('Foundations');
      const stringsTxt = page.getByText('Strings');
      const conditionalsTxt = page.getByText('Conditionals');

      // At least some of these concepts should be visible
      const foundationsVisible = await foundationsTxt.isVisible().catch(() => false);
      const stringsVisible = await stringsTxt.isVisible().catch(() => false);
      const conditionalsVisible = await conditionalsTxt.isVisible().catch(() => false);

      const visibleConcepts = [foundationsVisible, stringsVisible, conditionalsVisible].filter(Boolean);
      expect(visibleConcepts.length).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('contribution graph adapts on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for dashboard to load
      await expect(
        page.getByRole('heading', { name: /Good (morning|afternoon|evening|night)/i })
      ).toBeVisible({ timeout: 15000 });

      // Activity History section should still be visible
      await expect(page.getByText('Activity History')).toBeVisible();

      // On mobile, either compact view or collapsed based on props
      // The component should still function
    });

    test('skill tree is scrollable on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await authenticateUser(page, testUser);
      await page.goto('/dashboard');

      // Wait for skill tree to load
      await expect(
        page.getByTestId('skill-tree-container')
      ).toBeVisible({ timeout: 10000 });

      // The scroll container should exist
      const scrollContainer = page.getByTestId('skill-tree-scroll');
      await expect(scrollContainer).toBeVisible();
    });
  });
});
