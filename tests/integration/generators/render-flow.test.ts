// tests/integration/generators/render-flow.test.ts
import { describe, it, expect } from 'vitest';
import { renderExercise } from '@/lib/generators/render';
import { getGenerator, hasGenerator } from '@/lib/generators';
import type { Exercise } from '@/lib/types/app.types';

describe('Generator render flow integration', () => {
  it('slice-bounds generator is registered and functional', () => {
    expect(hasGenerator('slice-bounds')).toBe(true);
    const gen = getGenerator('slice-bounds');
    expect(gen).toBeDefined();

    const params = gen!.generate('integration-test-seed');
    expect(gen!.validate(params)).toBe(true);
  });

  it('renders a dynamic exercise with slice-bounds', () => {
    // Simulate a full Exercise object as would come from database
    const exercise = {
      id: 'test-id',
      slug: 'string-slice-dynamic',
      title: 'Dynamic Slicing',
      prompt: 'Get characters from index {{start}} to {{end}} (exclusive)',
      expectedAnswer: 's[{{start}}:{{end}}]',
      acceptedSolutions: ['s[{{start}}:{{end}}]'],
      hints: ['Use slice notation'],
      concept: 'strings',
      subconcept: 'slicing',
      level: 'practice',
      prereqs: ['strings.indexing'],
      exerciseType: 'write',
      pattern: 'indexing',
      objective: 'Practice dynamic slicing',
      generator: 'slice-bounds',
      difficulty: 2,
      language: 'python',
      category: 'strings',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as Exercise;

    const rendered = renderExercise(exercise, 'user-123', new Date('2026-01-15'));

    // Should have concrete values, not templates
    expect(rendered.prompt).not.toContain('{{');
    expect(rendered.expectedAnswer).not.toContain('{{');
    expect(rendered.acceptedSolutions[0]).not.toContain('{{');

    // Should have metadata
    expect(rendered._generatedParams).toBeDefined();
    expect(rendered._seed).toBeDefined();

    // Params should satisfy constraints
    const params = rendered._generatedParams!;
    expect(typeof params.start).toBe('number');
    expect(typeof params.end).toBe('number');
    expect(params.end).toBeGreaterThan(params.start as number);
  });

  it('static exercises pass through unchanged', () => {
    const exercise = {
      slug: 'static-exercise',
      prompt: 'Print hello world',
      expectedAnswer: 'print("hello world")',
      acceptedSolutions: [],
    };

    const rendered = renderExercise(exercise, 'user-123', new Date());

    expect(rendered.prompt).toBe('Print hello world');
    expect(rendered._generatedParams).toBeUndefined();
    expect(rendered._seed).toBeUndefined();
  });

  it('same user/exercise/date always produces same render', () => {
    const exercise = {
      slug: 'determinism-test',
      prompt: 'Index {{start}}',
      expectedAnswer: '{{start}}',
      acceptedSolutions: [],
      generator: 'slice-bounds',
    };

    const date = new Date('2026-01-15');
    const r1 = renderExercise(exercise, 'user-abc', date);
    const r2 = renderExercise(exercise, 'user-abc', date);

    expect(r1.prompt).toBe(r2.prompt);
    expect(r1.expectedAnswer).toBe(r2.expectedAnswer);
    expect(r1._seed).toBe(r2._seed);
  });
});
