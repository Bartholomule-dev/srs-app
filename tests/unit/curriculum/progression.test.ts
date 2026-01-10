// tests/unit/curriculum/progression.test.ts
import { describe, it, expect } from 'vitest';
import { getUnlockedConcepts } from '@/lib/curriculum/progression';
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
