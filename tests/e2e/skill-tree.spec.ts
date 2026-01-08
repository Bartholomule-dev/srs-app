// tests/e2e/skill-tree.spec.ts
import { test, expect } from '@playwright/test';
import { authenticateUser, createTestUser, deleteTestUser, TestUser } from './utils/auth';

test.describe('Skill Tree on Dashboard', () => {
  let testUser: TestUser;

  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    await deleteTestUser(testUser.id);
  });

  test('displays skill tree section on dashboard', async ({ page }) => {
    await authenticateUser(page, testUser);
    await page.goto('/dashboard');

    // Wait for dashboard to load
    await expect(page.getByText('Your Progress')).toBeVisible();

    // Should see skill tree section
    await expect(page.getByText('Your Learning Path')).toBeVisible();
  });

  test('shows concept clusters', async ({ page }) => {
    await authenticateUser(page, testUser);
    await page.goto('/dashboard');

    // Wait for skill tree to load
    await expect(
      page.getByTestId('skill-tree-container')
    ).toBeVisible({ timeout: 10000 });

    // Check for at least one concept name
    await expect(page.getByText('Foundations')).toBeVisible();
  });

  test('shows progress badges', async ({ page }) => {
    await authenticateUser(page, testUser);
    await page.goto('/dashboard');

    // Wait for skill tree to load
    await expect(
      page.getByTestId('skill-tree-container')
    ).toBeVisible({ timeout: 10000 });

    // Should see a progress badge (e.g., "0/4" for Foundations)
    // Use regex to match any progress badge pattern
    await expect(page.getByText(/\d+\/\d+/)).toBeVisible();
  });

  test('is horizontally scrollable container', async ({ page }) => {
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
