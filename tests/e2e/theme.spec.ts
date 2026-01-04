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
    // #0a0a0f in RGB is rgb(10, 10, 15)
    expect(bgColor).toBe('rgb(10, 10, 15)');
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

    // Verify dark mode values are set
    expect(cssVars.bgBase).toBe('#0a0a0f');
    expect(cssVars.textPrimary).toBe('#f0f0f5');
    expect(cssVars.accentPrimary).toBe('#3b82f6');
    expect(cssVars.border).toBe('#2a2a36');
  });

  test('color scheme is dark', async ({ page }) => {
    await page.goto('/');

    const colorScheme = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).colorScheme;
    });

    expect(colorScheme).toBe('dark');
  });
});
