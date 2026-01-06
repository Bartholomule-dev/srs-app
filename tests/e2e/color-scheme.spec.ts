/**
 * Color Scheme Verification Tests
 *
 * Ensures the warm gold theme is consistently applied across all pages.
 * Checks for any remaining blue colors that should have been migrated.
 */
import { test, expect, Page } from '@playwright/test';

// Blue color patterns to detect (should NOT exist in our gold theme)
const BLUE_PATTERNS = [
  /rgba?\s*\(\s*59\s*,\s*130\s*,\s*246/i,     // blue-500 rgb
  /rgba?\s*\(\s*37\s*,\s*99\s*,\s*235/i,      // blue-600 rgb
  /rgba?\s*\(\s*96\s*,\s*165\s*,\s*250/i,     // blue-400 rgb
  /#3b82f6/i,                                   // blue-500 hex
  /#2563eb/i,                                   // blue-600 hex
  /#60a5fa/i,                                   // blue-400 hex
];

// Gold/amber color patterns we expect to find
const GOLD_PATTERNS = [
  /rgba?\s*\(\s*245\s*,\s*158\s*,\s*11/i,     // amber-500 rgb
  /rgba?\s*\(\s*217\s*,\s*119\s*,\s*6/i,      // amber-600 rgb
  /rgba?\s*\(\s*249\s*,\s*115\s*,\s*22/i,     // orange-500 rgb
  /#f59e0b/i,                                   // amber-500 hex
  /#d97706/i,                                   // amber-600 hex
  /#f97316/i,                                   // orange-500 hex
];

// Viewports to test
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
];

/**
 * Extract all computed colors from visible elements on the page
 */
async function extractPageColors(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const colors: Set<string> = new Set();
    const elements = document.querySelectorAll('*');

    elements.forEach((el) => {
      const style = window.getComputedStyle(el);
      const colorProps = [
        'color',
        'backgroundColor',
        'borderColor',
        'borderTopColor',
        'borderRightColor',
        'borderBottomColor',
        'borderLeftColor',
        'outlineColor',
        'boxShadow',
        'textDecorationColor',
        'fill',
        'stroke',
      ];

      colorProps.forEach((prop) => {
        const value = style.getPropertyValue(prop);
        if (value && value !== 'none' && value !== 'transparent') {
          colors.add(value);
        }
      });
    });

    return Array.from(colors);
  });
}

/**
 * Check if any colors match the forbidden blue patterns
 */
function findBlueColors(colors: string[]): string[] {
  const blueFound: string[] = [];

  colors.forEach((color) => {
    BLUE_PATTERNS.forEach((pattern) => {
      if (pattern.test(color)) {
        blueFound.push(color);
      }
    });
  });

  return [...new Set(blueFound)];
}

/**
 * Check if gold colors are present (sanity check)
 */
function findGoldColors(colors: string[]): string[] {
  const goldFound: string[] = [];

  colors.forEach((color) => {
    GOLD_PATTERNS.forEach((pattern) => {
      if (pattern.test(color)) {
        goldFound.push(color);
      }
    });
  });

  return [...new Set(goldFound)];
}

test.describe('Color Scheme Verification', () => {
  test.describe('Landing Page (Public)', () => {
    for (const viewport of VIEWPORTS) {
      test(`should use gold theme on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500); // Wait for animations

        // Take screenshot for visual reference
        await page.screenshot({
          path: `screenshots/color-test-landing-${viewport.name}.png`,
          fullPage: true
        });

        // Extract and check colors
        const colors = await extractPageColors(page);
        const blueColors = findBlueColors(colors);
        const goldColors = findGoldColors(colors);

        // Log findings for debugging
        if (blueColors.length > 0) {
          console.log(`[Landing ${viewport.name}] Blue colors found:`, blueColors);
        }
        console.log(`[Landing ${viewport.name}] Gold colors found:`, goldColors.length);

        // Assertions
        expect(blueColors, `Found unexpected blue colors on landing page (${viewport.name})`).toHaveLength(0);
        expect(goldColors.length, `Expected gold colors on landing page (${viewport.name})`).toBeGreaterThan(0);
      });
    }
  });

  test.describe('Authenticated Pages', () => {
    // Note: These tests will show the landing page redirect if not authenticated
    // In a real scenario, you'd set up authentication first

    test('dashboard page should use gold theme', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'screenshots/color-test-dashboard.png',
        fullPage: true
      });

      const colors = await extractPageColors(page);
      const blueColors = findBlueColors(colors);

      if (blueColors.length > 0) {
        console.log('[Dashboard] Blue colors found:', blueColors);
      }

      expect(blueColors, 'Found unexpected blue colors on dashboard').toHaveLength(0);
    });

    test('practice page should use gold theme', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/practice');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'screenshots/color-test-practice.png',
        fullPage: true
      });

      const colors = await extractPageColors(page);
      const blueColors = findBlueColors(colors);

      if (blueColors.length > 0) {
        console.log('[Practice] Blue colors found:', blueColors);
      }

      expect(blueColors, 'Found unexpected blue colors on practice page').toHaveLength(0);
    });
  });

  test.describe('Component-Level Checks', () => {
    test('buttons should have gold accent color', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Find primary buttons
      const buttons = page.locator('button').filter({ hasText: /start free|get started/i });
      const count = await buttons.count();

      expect(count, 'Should find at least one CTA button').toBeGreaterThan(0);

      // Check the first button's background color
      const firstButton = buttons.first();
      const bgColor = await firstButton.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      console.log('[Button] Background color:', bgColor);

      // Should be amber/gold, not blue
      const isBlue = BLUE_PATTERNS.some(pattern => pattern.test(bgColor));
      expect(isBlue, `Button has blue background: ${bgColor}`).toBe(false);
    });

    test('gradient text should use gold colors', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Find the "Code Sharp" gradient text in hero
      const gradientText = page.locator('span.bg-gradient-to-r').first();

      if (await gradientText.count() > 0) {
        // Get the computed background-image (gradient)
        const bgImage = await gradientText.evaluate((el) => {
          return window.getComputedStyle(el).backgroundImage;
        });

        console.log('[Gradient] Background image:', bgImage.substring(0, 100) + '...');

        // Check it doesn't contain blue
        const hasBlue = BLUE_PATTERNS.some(pattern => pattern.test(bgImage));
        expect(hasBlue, `Gradient contains blue: ${bgImage}`).toBe(false);
      }
    });
  });
});
