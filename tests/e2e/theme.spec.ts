import { test, expect } from '@playwright/test';

test.describe('Theme System', () => {
  test('dark mode is default', async ({ page }) => {
    await page.goto('/');

    // Verify dark class on html
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('dark');

    // Verify dark background on body
    const bgColor = await page.locator('body').evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    // #0c0a08 in RGB is rgb(12, 10, 8) - warm undertone
    expect(bgColor).toBe('rgb(12, 10, 8)');
  });

  test('fonts are loaded', async ({ page }) => {
    await page.goto('/');

    // Wait for page to fully load including fonts
    await page.waitForLoadState('domcontentloaded');

    const fontFamily = await page.locator('body').evaluate((el) =>
      getComputedStyle(el).fontFamily
    );
    // Font should include DM Sans (variable font)
    expect(fontFamily.toLowerCase()).toContain('dm sans');
  });

  test('CSS custom properties are defined', async ({ page }) => {
    await page.goto('/');

    // Verify key CSS variables are defined
    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      return {
        bgBase: computedStyle.getPropertyValue('--bg-base').trim(),
        textPrimary: computedStyle.getPropertyValue('--text-primary').trim(),
        accentPrimary: computedStyle.getPropertyValue('--accent-primary').trim(),
        border: computedStyle.getPropertyValue('--border').trim(),
      };
    });

    // Verify dark mode values are set (warm undertones + amber accent)
    expect(cssVars.bgBase).toBe('#0c0a08');
    expect(cssVars.textPrimary).toBe('#f5f3f0');
    expect(cssVars.accentPrimary).toBe('#f59e0b');
    expect(cssVars.border).toBe('#332e26');
  });

  test('color scheme is dark', async ({ page }) => {
    await page.goto('/');

    const colorScheme = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).colorScheme;
    });

    expect(colorScheme).toBe('dark');
  });
});
