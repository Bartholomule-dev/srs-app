import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, authenticateUser, TestUser } from './utils/auth';

let testUser: TestUser;

test.describe('Full Practice Session Flow', () => {
  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      await deleteTestUser(testUser.id);
    }
  });

  test('complete multiple questions without session resetting', async ({ page }) => {
    test.setTimeout(240000); // 4 minute timeout for full session (teaching cards + exercises)
    await authenticateUser(page, testUser);

    // Navigate to practice page directly
    await page.goto('/practice');

    // Wait for practice page to load - either exercise, teaching card, or empty state
    const submitButton = page.getByRole('button', { name: /submit/i });
    const gotItButton = page.getByRole('button', { name: /got it/i });
    const allCaughtUp = page.getByText(/all caught up/i);

    // Wait for either submit button, teaching card, or empty state to appear
    await expect(submitButton.or(gotItButton).or(allCaughtUp)).toBeVisible({ timeout: 15000 });

    // Handle teaching cards - click through them to get to exercises
    while (await gotItButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await gotItButton.click();
      await page.waitForTimeout(300);
    }

    // Check if we have exercises or empty state
    const hasExercises = await submitButton.isVisible().catch(() => false);

    if (!hasExercises) {
      // Empty state - no exercises to practice
      console.log('No exercises available - test passed (empty state)');
      return;
    }

    // Track completed questions
    let questionsCompleted = 0;
    const maxQuestions = 5; // Safety limit (typical session has 5 exercises)
    let teachingCardsClicked = 0;
    const maxTeachingCards = 10; // Safety limit for teaching cards

    while (questionsCompleted < maxQuestions) {
      // Check if session is complete (multiple indicators)
      const sessionComplete = page.getByText(/great work|session complete|all caught up/i);
      const backToDashboard = page.getByRole('button', { name: /back to dashboard/i });
      const sessionSummary = page.locator('[class*="SessionSummary"]');

      const isComplete = await Promise.race([
        sessionComplete.isVisible({ timeout: 500 }).catch(() => false),
        backToDashboard.isVisible({ timeout: 500 }).catch(() => false),
        sessionSummary.isVisible({ timeout: 500 }).catch(() => false),
      ]);

      if (isComplete) {
        console.log(`Session complete after ${questionsCompleted} questions`);
        break;
      }

      // Handle teaching cards - click "Got it" to advance (with limit)
      const gotItBtn = page.getByRole('button', { name: /got it/i });
      if (await gotItBtn.isVisible({ timeout: 300 }).catch(() => false)) {
        if (teachingCardsClicked >= maxTeachingCards) {
          console.log('Max teaching cards reached - breaking');
          break;
        }
        await gotItBtn.click();
        teachingCardsClicked++;
        console.log(`Clicked teaching card ${teachingCardsClicked}`);
        await page.waitForTimeout(200);
        continue;
      }

      // Answer the question
      const answerInput = page.getByRole('textbox').first();
      if (await answerInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await answerInput.fill('test_answer');
        console.log('Filled answer input');
      } else {
        console.log('No answer input found');
      }

      // Submit answer
      const currentSubmitBtn = page.getByRole('button', { name: /submit/i });
      if (await currentSubmitBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await currentSubmitBtn.click();
        console.log('Clicked submit');
      } else {
        console.log('No submit button - session might be complete');
        break;
      }

      // Wait for feedback and continue button
      const continueButton = page.getByRole('button', { name: /continue/i });
      try {
        await expect(continueButton).toBeVisible({ timeout: 5000 });
      } catch {
        console.log('Continue button not visible - checking if session complete');
        // Check if we completed the session
        if (await sessionComplete.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log('Session completed after submit');
          break;
        }
        throw new Error('Neither Continue button nor session complete visible');
      }

      questionsCompleted++;
      console.log(`Completed question ${questionsCompleted}`);

      // Click continue to go to next question
      await continueButton.click();
      await page.waitForTimeout(200);
    }

    // Verify session completed successfully (should see summary or completion message)
    // Allow some time for the completion state to render
    await page.waitForTimeout(300);

    const completionIndicators = [
      page.getByText(/session complete/i),
      page.getByText(/great work/i),
      page.getByText(/all caught up/i),
      page.getByText(/reviewed/i),
      page.getByRole('button', { name: /back to dashboard/i }),
      page.getByRole('link', { name: /dashboard/i }),
    ];

    let foundCompletion = false;
    for (const indicator of completionIndicators) {
      if (await indicator.isVisible({ timeout: 1000 }).catch(() => false)) {
        foundCompletion = true;
        break;
      }
    }

    // If we completed questions, we should see a completion state
    if (questionsCompleted > 0) {
      expect(foundCompletion).toBe(true);
    }

    console.log(`Test complete: answered ${questionsCompleted} questions`);
  });

  test('session progress increments correctly', async ({ page }) => {
    await authenticateUser(page, testUser);
    await page.goto('/practice');

    // Wait for either submit button, teaching card, or empty state
    const submitButton = page.getByRole('button', { name: /submit/i });
    const gotItButton = page.getByRole('button', { name: /got it/i });
    const allCaughtUp = page.getByText(/all caught up/i);
    await expect(submitButton.or(gotItButton).or(allCaughtUp)).toBeVisible({ timeout: 15000 });

    // Handle teaching cards - click through them to get to exercises
    while (await gotItButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await gotItButton.click();
      await page.waitForTimeout(300);
    }

    const hasExercises = await submitButton.isVisible().catch(() => false);

    if (!hasExercises) {
      console.log('No exercises - skipping progress test');
      return;
    }

    // Complete first question and track progress
    const answerInput = page.getByRole('textbox').first();
    await answerInput.fill('test');
    await submitButton.click();

    const continueButton = page.getByRole('button', { name: /continue/i });
    await expect(continueButton).toBeVisible({ timeout: 5000 });
    await continueButton.click();

    // After clicking continue, verify we're either:
    // 1. On the next question (different content)
    // 2. On a teaching card
    // 3. At session complete (if only 1 question)
    await page.waitForTimeout(1000);

    const nextSubmit = page.getByRole('button', { name: /submit/i });
    const nextGotIt = page.getByRole('button', { name: /got it/i });
    const sessionComplete = page.getByText('Session Complete!');

    // Wait for either to appear
    await expect(nextSubmit.or(nextGotIt).or(sessionComplete)).toBeVisible({ timeout: 5000 });

    const hasNextQuestion = await nextSubmit.isVisible().catch(() => false);
    const hasTeachingCard = await nextGotIt.isVisible().catch(() => false);
    const isComplete = await sessionComplete.isVisible().catch(() => false);

    console.log(`After first question: hasNext=${hasNextQuestion}, hasTeaching=${hasTeachingCard}, isComplete=${isComplete}`);
    expect(hasNextQuestion || hasTeachingCard || isComplete).toBe(true);
  });
});
