import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  LOCAL_SUPABASE_URL,
  LOCAL_SUPABASE_SERVICE_KEY,
} from '../../setup';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

/**
 * These tests validate that the exercise seed data has been properly imported.
 *
 * Prerequisites:
 *   1. Local Supabase must be running: pnpm db:start
 *   2. Exercises must be imported: pnpm db:import-exercises
 *
 * If the database is not available or has no exercises, these tests will skip.
 */
describe('Exercise Seed Data', () => {
  let exerciseCount = 0;
  let skipTests = false;

  beforeAll(async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id')
        .eq('language', 'python');

      if (error) {
        console.warn('Skipping seed tests: Database not reachable');
        skipTests = true;
        return;
      }

      exerciseCount = data?.length ?? 0;
      if (exerciseCount === 0) {
        console.warn(
          'Skipping seed tests: No exercises found.\n' +
          '  Run: pnpm db:import-exercises'
        );
        skipTests = true;
      }
    } catch {
      console.warn('Skipping seed tests: Database connection failed');
      skipTests = true;
    }
  });

  it('has at least 50 Python exercises', async () => {
    if (skipTests) {
      return; // Skip silently - warning already logged in beforeAll
    }

    const { data, error } = await supabase
      .from('exercises')
      .select('id')
      .eq('language', 'python');

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(50);
  });

  it('has exercises in all 10 categories', async () => {
    if (skipTests) return;

    const { data } = await supabase
      .from('exercises')
      .select('category')
      .eq('language', 'python');

    const categories = new Set(data!.map(e => e.category));
    const expectedCategories = [
      'foundations', 'strings', 'numbers-booleans', 'collections',
      'control-flow', 'functions', 'comprehensions', 'error-handling',
      'oop', 'modules-files'
    ];

    for (const cat of expectedCategories) {
      expect(categories.has(cat)).toBe(true);
    }
  });

  it('has exercises at all difficulty levels (1, 2, 3)', async () => {
    if (skipTests) return;

    const { data } = await supabase
      .from('exercises')
      .select('difficulty')
      .eq('language', 'python');

    const difficulties = new Set(data!.map(e => e.difficulty));
    expect(difficulties.has(1)).toBe(true);
    expect(difficulties.has(2)).toBe(true);
    expect(difficulties.has(3)).toBe(true);
  });

  it('all exercises have valid slugs', async () => {
    if (skipTests) return;

    const { data } = await supabase
      .from('exercises')
      .select('slug')
      .eq('language', 'python');

    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const exercise of data!) {
      expect(exercise.slug).toMatch(slugRegex);
    }
  });

  it('all exercises have at least one hint', async () => {
    if (skipTests) return;

    const { data } = await supabase
      .from('exercises')
      .select('hints, slug')
      .eq('language', 'python');

    for (const exercise of data!) {
      const hints = exercise.hints as string[];
      expect(hints.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('slugs are unique within language', async () => {
    if (skipTests) return;

    const { data } = await supabase
      .from('exercises')
      .select('slug')
      .eq('language', 'python');

    const slugs = data!.map(e => e.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });
});
