// tests/unit/curriculum/progression.test.ts
import { describe, it, expect } from 'vitest';
import {
  getUnlockedConcepts,
  getNextSubconcepts,
  getSkippedConceptsByExperience,
} from '@/lib/curriculum/progression';
import type { Concept } from '@/lib/curriculum/types';

// Test curriculum graph (simplified subset)
const testCurriculum: Concept[] = [
  {
    slug: 'foundations',
    name: 'Foundations',
    description: 'Basic concepts',
    prereqs: [],
    subconcepts: ['variables', 'operators', 'expressions'],
  },
  {
    slug: 'strings',
    name: 'Strings',
    description: 'String manipulation',
    prereqs: ['foundations'],
    subconcepts: ['basics', 'indexing', 'slicing'],
  },
  {
    slug: 'numbers-booleans',
    name: 'Numbers & Booleans',
    description: 'Numeric types',
    prereqs: ['foundations'],
    subconcepts: ['integers', 'floats', 'booleans'],
  },
  {
    slug: 'conditionals',
    name: 'Conditionals',
    description: 'Branching logic',
    prereqs: ['numbers-booleans'],
    subconcepts: ['if-else', 'elif-chains', 'ternary'],
  },
  {
    slug: 'collections',
    name: 'Collections',
    description: 'Lists, dicts, etc.',
    prereqs: ['strings', 'numbers-booleans'],
    subconcepts: ['lists', 'tuples', 'dicts'],
  },
  {
    slug: 'loops',
    name: 'Loops',
    description: 'Iteration',
    prereqs: ['conditionals', 'collections'],
    subconcepts: ['for', 'while', 'range'],
  },
];

describe('getUnlockedConcepts', () => {
  it('returns only foundations for fresh beginner (no completed subconcepts)', () => {
    const completed = new Set<string>();
    const unlocked = getUnlockedConcepts(completed, testCurriculum);
    expect(unlocked).toEqual(['foundations']);
  });

  it('unlocks strings AND numbers-booleans when foundations has one subconcept completed', () => {
    const completed = new Set(['variables']);
    const unlocked = getUnlockedConcepts(completed, testCurriculum);
    expect(unlocked).toContain('foundations');
    expect(unlocked).toContain('strings');
    expect(unlocked).toContain('numbers-booleans');
    expect(unlocked).not.toContain('conditionals');
  });

  it('unlocks conditionals when numbers-booleans has subconcept completed', () => {
    const completed = new Set(['variables', 'integers']);
    const unlocked = getUnlockedConcepts(completed, testCurriculum);
    expect(unlocked).toContain('conditionals');
  });

  it('unlocks collections when both strings AND numbers-booleans have subconcepts', () => {
    const completed = new Set(['variables', 'basics', 'integers']);
    const unlocked = getUnlockedConcepts(completed, testCurriculum);
    expect(unlocked).toContain('collections');
  });

  it('does NOT unlock loops until both conditionals AND collections have progress', () => {
    const completed = new Set(['variables', 'basics', 'integers', 'lists']);
    const unlocked = getUnlockedConcepts(completed, testCurriculum);
    expect(unlocked).not.toContain('loops');
  });

  it('unlocks loops when conditionals AND collections have subconcepts', () => {
    const completed = new Set(['variables', 'basics', 'integers', 'lists', 'if-else']);
    const unlocked = getUnlockedConcepts(completed, testCurriculum);
    expect(unlocked).toContain('loops');
  });
});

describe('getNextSubconcepts', () => {
  it('returns intro subconcepts from foundations for fresh beginner', () => {
    const completed = new Set<string>();
    const inProgress = new Set<string>();
    const next = getNextSubconcepts(completed, inProgress, testCurriculum, 3);
    expect(next.length).toBeLessThanOrEqual(3);
    expect(next.every(s => testCurriculum[0].subconcepts.includes(s))).toBe(true);
  });

  it('prioritizes finishing current concept over starting new ones', () => {
    const completed = new Set(['variables']);
    const inProgress = new Set(['operators']);
    const next = getNextSubconcepts(completed, inProgress, testCurriculum, 3);
    expect(next).toContain('expressions');
    expect(next).not.toContain('operators');
  });

  it('returns subconcepts from multiple unlocked concepts when limit allows', () => {
    const completed = new Set(['variables', 'operators', 'expressions']);
    const inProgress = new Set<string>();
    const next = getNextSubconcepts(completed, inProgress, testCurriculum, 5);
    const fromStrings = next.filter(s => testCurriculum[1].subconcepts.includes(s));
    const fromNumbers = next.filter(s => testCurriculum[2].subconcepts.includes(s));
    expect(fromStrings.length).toBeGreaterThan(0);
    expect(fromNumbers.length).toBeGreaterThan(0);
  });

  it('excludes already completed subconcepts', () => {
    const completed = new Set(['variables', 'operators']);
    const inProgress = new Set<string>();
    const next = getNextSubconcepts(completed, inProgress, testCurriculum, 5);
    expect(next).not.toContain('variables');
    expect(next).not.toContain('operators');
  });

  it('excludes in-progress subconcepts', () => {
    const completed = new Set<string>();
    const inProgress = new Set(['variables']);
    const next = getNextSubconcepts(completed, inProgress, testCurriculum, 5);
    expect(next).not.toContain('variables');
    expect(next).toContain('operators');
  });

  it('respects the limit parameter', () => {
    const completed = new Set<string>();
    const inProgress = new Set<string>();
    const next = getNextSubconcepts(completed, inProgress, testCurriculum, 2);
    expect(next.length).toBeLessThanOrEqual(2);
  });

  it('returns empty array when all subconcepts completed or in-progress', () => {
    const allSubconcepts = testCurriculum.flatMap(c => c.subconcepts);
    const completed = new Set(allSubconcepts);
    const inProgress = new Set<string>();
    const next = getNextSubconcepts(completed, inProgress, testCurriculum, 5);
    expect(next).toEqual([]);
  });
});

describe('getSkippedConceptsByExperience', () => {
  it('returns empty set for beginner (start from scratch)', () => {
    const skipped = getSkippedConceptsByExperience('beginner');
    expect(skipped.size).toBe(0);
  });

  it('returns foundations + strings + numbers-booleans for learning level', () => {
    const skipped = getSkippedConceptsByExperience('learning');
    expect(skipped.has('foundations')).toBe(true);
    expect(skipped.has('strings')).toBe(true);
    expect(skipped.has('numbers-booleans')).toBe(true);
    expect(skipped.has('conditionals')).toBe(false);
  });

  it('returns early concepts for refresher (experienced developers)', () => {
    const skipped = getSkippedConceptsByExperience('refresher');
    expect(skipped.has('foundations')).toBe(true);
    expect(skipped.has('strings')).toBe(true);
    expect(skipped.has('numbers-booleans')).toBe(true);
    expect(skipped.has('conditionals')).toBe(true);
    expect(skipped.has('collections')).toBe(true);
    expect(skipped.has('loops')).toBe(true);
    // Should NOT skip advanced concepts
    expect(skipped.has('functions')).toBe(false);
    expect(skipped.has('oop')).toBe(false);
  });
});
