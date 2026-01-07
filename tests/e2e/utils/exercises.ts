// tests/e2e/utils/exercises.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Page, BrowserContext } from '@playwright/test';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Get admin Supabase client for test setup.
 */
export function getAdminClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Insert a dynamic exercise for testing.
 * Returns the created exercise slug for cleanup.
 */
export async function insertDynamicExercise(
  adminClient: SupabaseClient,
  overrides: Partial<{
    slug: string;
    generator: string | null;
    targetConstruct: { type: string; feedback: string } | null;
    exerciseType: string;
    expectedAnswer: string;
    acceptedSolutions: string[];
    prompt: string;
    code: string | null;
    template: string | null;
  }> = {}
): Promise<string> {
  const slug = overrides.slug ?? `e2e-dynamic-${Date.now()}`;

  // Handle generator - use null if explicitly passed, otherwise default to 'slice-bounds'
  const generator = 'generator' in overrides ? overrides.generator : 'slice-bounds';

  const { error } = await adminClient.from('exercises').insert({
    slug,
    title: 'E2E Dynamic Test',
    prompt: overrides.prompt ?? 'Get characters from index {{start}} to {{end}}',
    expected_answer: overrides.expectedAnswer ?? 's[{{start}}:{{end}}]',
    accepted_solutions: overrides.acceptedSolutions ?? ['s[{{start}}:{{end}}]'],
    hints: ['Use slice notation'],
    difficulty: 2,
    language: 'python',
    category: 'strings',
    tags: ['e2e', 'dynamic'],
    concept: 'strings',
    subconcept: 'slicing',
    level: 'practice',
    prereqs: [],
    exercise_type: overrides.exerciseType ?? 'write',
    pattern: 'indexing',
    objective: 'E2E test exercise',
    generator,
    target_construct: overrides.targetConstruct ?? null,
    code: overrides.code ?? null,
    template: overrides.template ?? null,
  });

  if (error) {
    throw new Error(`Failed to insert test exercise: ${error.message}`);
  }

  return slug;
}

/**
 * Delete a test exercise by slug.
 */
export async function deleteExercise(
  adminClient: SupabaseClient,
  slug: string
): Promise<void> {
  await adminClient.from('exercises').delete().eq('slug', slug);
}

/**
 * Get the visible exercise prompt text from the page.
 */
export async function getExercisePrompt(page: Page): Promise<string | null> {
  // The prompt is typically in the ExerciseCard component
  const promptLocator = page.locator('[data-testid="exercise-prompt"]');
  if (await promptLocator.isVisible({ timeout: 1000 }).catch(() => false)) {
    return promptLocator.textContent();
  }

  // Fallback: look for prompt in heading or main content area
  const heading = page.locator('h2, h3').first();
  return heading.textContent();
}

/**
 * Wait for either an exercise or session complete state.
 */
export async function waitForExerciseOrComplete(page: Page): Promise<'exercise' | 'complete' | 'teaching'> {
  const submitBtn = page.getByRole('button', { name: /submit/i });
  const gotItBtn = page.getByRole('button', { name: /got it/i });
  const complete = page.getByText(/session complete|all caught up|great work/i);

  await Promise.race([
    submitBtn.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    gotItBtn.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    complete.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
  ]);

  if (await submitBtn.isVisible().catch(() => false)) return 'exercise';
  if (await gotItBtn.isVisible().catch(() => false)) return 'teaching';
  return 'complete';
}

/**
 * Inject a fixed date into browser context for deterministic testing.
 */
export async function mockDate(context: BrowserContext, date: Date): Promise<void> {
  const timestamp = date.getTime();
  await context.addInitScript(`{
    const fixedDate = new Date(${timestamp});
    Date.now = () => ${timestamp};
    const _Date = Date;
    Date = class extends _Date {
      constructor(...args) {
        if (args.length === 0) {
          super(${timestamp});
        } else {
          super(...args);
        }
      }
    };
  }`);
}
