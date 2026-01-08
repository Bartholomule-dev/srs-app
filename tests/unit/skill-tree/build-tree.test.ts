// tests/unit/skill-tree/build-tree.test.ts
import { describe, it, expect } from 'vitest';
import { buildSkillTreeData } from '@/lib/skill-tree/build-tree';
import { MASTERY_STABILITY_FAST, MASTERY_STABILITY_STANDARD, MASTERY_REPS } from '@/lib/skill-tree/types';
import type { SubconceptProgress, ConceptSlug } from '@/lib/curriculum/types';

describe('buildSkillTreeData', () => {
  const makeProgress = (
    slug: string,
    concept: ConceptSlug,
    stability: number,
    reps = 1
  ): SubconceptProgress => ({
    id: `id-${slug}`,
    userId: 'user-1',
    subconceptSlug: slug,
    conceptSlug: concept,
    stability,
    difficulty: 5,
    fsrsState: 2,
    reps,
    lapses: 0,
    elapsedDays: 0,
    scheduledDays: 1,
    nextReview: new Date(),
    lastReviewed: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('builds tree with all 11 concept clusters', () => {
    const result = buildSkillTreeData([]);

    expect(result.clusters).toHaveLength(11);
    expect(result.clusters.map((c) => c.slug)).toEqual([
      'foundations',
      'strings',
      'numbers-booleans',
      'conditionals',
      'collections',
      'loops',
      'functions',
      'comprehensions',
      'error-handling',
      'oop',
      'modules-files',
    ]);
  });

  it('assigns correct tiers based on curriculum DAG', () => {
    const result = buildSkillTreeData([]);

    const tierMap = new Map(result.clusters.map((c) => [c.slug, c.tier]));
    expect(tierMap.get('foundations')).toBe(1);
    expect(tierMap.get('strings')).toBe(2);
    expect(tierMap.get('numbers-booleans')).toBe(2);
    expect(tierMap.get('conditionals')).toBe(3);
    expect(tierMap.get('collections')).toBe(3);
    expect(tierMap.get('loops')).toBe(4);
    expect(tierMap.get('functions')).toBe(5);
    expect(tierMap.get('comprehensions')).toBe(5);
    expect(tierMap.get('error-handling')).toBe(6);
    expect(tierMap.get('oop')).toBe(6);
    expect(tierMap.get('modules-files')).toBe(7);
  });

  it('counts total subconcepts correctly', () => {
    const result = buildSkillTreeData([]);

    expect(result.totalSubconcepts).toBe(65); // 62 original + decorators + dataclasses + generators
  });

  it('computes mastered count from progress (fast-track)', () => {
    const progress = [
      makeProgress('variables', 'foundations', MASTERY_STABILITY_FAST), // mastered via fast-track
      makeProgress('operators', 'foundations', MASTERY_STABILITY_FAST), // mastered via fast-track
      makeProgress('expressions', 'foundations', 5), // in-progress
    ];

    const result = buildSkillTreeData(progress);

    expect(result.totalMastered).toBe(2);
  });

  it('computes mastered count from progress (standard path)', () => {
    const progress = [
      makeProgress('variables', 'foundations', MASTERY_STABILITY_STANDARD, MASTERY_REPS), // mastered via standard
      makeProgress('operators', 'foundations', MASTERY_STABILITY_STANDARD, MASTERY_REPS), // mastered via standard
      makeProgress('expressions', 'foundations', 10, 2), // proficient, not mastered
    ];

    const result = buildSkillTreeData(progress);

    expect(result.totalMastered).toBe(2);
  });

  it('computes cluster mastered counts', () => {
    const progress = [
      makeProgress('variables', 'foundations', MASTERY_STABILITY_FAST),
      makeProgress('operators', 'foundations', MASTERY_STABILITY_STANDARD, MASTERY_REPS),
    ];

    const result = buildSkillTreeData(progress);
    const foundations = result.clusters.find((c) => c.slug === 'foundations');

    expect(foundations?.masteredCount).toBe(2);
    expect(foundations?.totalCount).toBe(5); // foundations has 5 subconcepts (added imports-basic)
  });

  it('sets correct states for subconcepts', () => {
    const progress = [
      makeProgress('variables', 'foundations', MASTERY_STABILITY_FAST), // mastered via fast-track
    ];

    const result = buildSkillTreeData(progress);
    const foundations = result.clusters.find((c) => c.slug === 'foundations');
    const variables = foundations?.subconcepts.find((s) => s.slug === 'variables');
    const operators = foundations?.subconcepts.find((s) => s.slug === 'operators');

    expect(variables?.state).toBe('mastered');
    expect(operators?.state).toBe('available'); // prereq (variables) is mastered
  });

  it('marks subconcepts as locked when prereqs not met', () => {
    const result = buildSkillTreeData([]); // No progress at all

    const foundations = result.clusters.find((c) => c.slug === 'foundations');
    const variables = foundations?.subconcepts.find((s) => s.slug === 'variables');
    const operators = foundations?.subconcepts.find((s) => s.slug === 'operators');

    expect(variables?.state).toBe('available'); // No prereqs
    expect(operators?.state).toBe('locked'); // Prereq (variables) not mastered
  });

  it('includes stability in node data', () => {
    const progress = [makeProgress('variables', 'foundations', 15.5)];

    const result = buildSkillTreeData(progress);
    const foundations = result.clusters.find((c) => c.slug === 'foundations');
    const variables = foundations?.subconcepts.find((s) => s.slug === 'variables');

    expect(variables?.stability).toBe(15.5);
  });

  it('sets stability to null for subconcepts without progress', () => {
    const result = buildSkillTreeData([]);

    const foundations = result.clusters.find((c) => c.slug === 'foundations');
    const variables = foundations?.subconcepts.find((s) => s.slug === 'variables');

    expect(variables?.stability).toBeNull();
  });
});
