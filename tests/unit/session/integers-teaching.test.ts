import { describe, it, expect } from 'vitest';
import { getSubconceptDefinition, getAllSubconcepts } from '@/lib/curriculum';
import { buildTeachingPair } from '@/lib/session';
import type { Exercise } from '@/lib/types';

describe('Integers Teaching Pair', () => {
  it('should have a valid subconcept definition for integers', () => {
    const def = getSubconceptDefinition('integers');
    expect(def).toBeDefined();
    expect(def?.teaching).toBeDefined();
    expect(def?.teaching?.exampleSlug).toBe('floor-division-intro');
  });

  it('should build teaching pair for integers with mock exercises', () => {
    const def = getSubconceptDefinition('integers');
    expect(def).toBeDefined();

    // Mock exercises - one for example, one for practice
    const mockExercises: Exercise[] = [
      {
        id: '1',
        slug: 'floor-division-intro',
        title: 'Floor Division',
        prompt: 'Test',
        expectedAnswer: '17 // 5',
        difficulty: 1,
        concept: 'foundations',
        subconcept: 'operators', // Example can be from different subconcept
        level: 'intro',
        exerciseType: 'write',
        pattern: 'arithmetic',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        slug: 'int-floor-div-fill',
        title: 'Integer Floor Division',
        prompt: 'Test',
        expectedAnswer: '//',
        difficulty: 1,
        concept: 'numbers-booleans',
        subconcept: 'integers', // Practice must match subconcept
        level: 'intro',
        exerciseType: 'fill-in',
        pattern: 'arithmetic',
        template: 'result = 10 ___ 3',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const pair = buildTeachingPair('integers', def!, mockExercises);

    expect(pair).not.toBeNull();
    expect(pair?.teachingCard.exampleExercise.slug).toBe('floor-division-intro');
    expect(pair?.practiceCard.exercise.slug).toBe('int-floor-div-fill');
    expect(pair?.practiceCard.exercise.subconcept).toBe('integers');
  });

  it('should list integers in curriculum order', () => {
    const subconcepts = getAllSubconcepts();

    // Find position of strings basics and integers
    const basicsIndex = subconcepts.indexOf('basics');
    const integersIndex = subconcepts.indexOf('integers');

    console.log('Subconcept order around integers:');
    console.log('- basics at index:', basicsIndex);
    console.log('- integers at index:', integersIndex);
    console.log('First 15 subconcepts:', subconcepts.slice(0, 15).join(', '));

    // integers should come after strings subconcepts
    expect(integersIndex).toBeGreaterThan(basicsIndex);
  });
});
