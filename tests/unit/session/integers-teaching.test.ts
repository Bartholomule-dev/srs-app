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
        language: 'python',
        category: 'foundations',
        title: 'Floor Division',
        prompt: 'Test',
        expectedAnswer: '17 // 5',
        acceptedSolutions: [],
        hints: ['Use //'],
        explanation: null,
        tags: [],
        timesPracticed: 0,
        avgSuccessRate: null,
        difficulty: 1,
        concept: 'foundations',
        subconcept: 'operators', // Example can be from different subconcept
        level: 'intro',
        prereqs: [],
        exerciseType: 'write',
        pattern: 'arithmetic',
        objective: 'Learn floor division',
        targets: null,
        template: null,
        blankPosition: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        slug: 'int-floor-div-fill',
        language: 'python',
        category: 'numbers-booleans',
        title: 'Integer Floor Division',
        prompt: 'Test',
        expectedAnswer: '//',
        acceptedSolutions: [],
        hints: ['Use //'],
        explanation: null,
        tags: [],
        timesPracticed: 0,
        avgSuccessRate: null,
        difficulty: 1,
        concept: 'numbers-booleans',
        subconcept: 'integers', // Practice must match subconcept
        level: 'intro',
        prereqs: [],
        exerciseType: 'fill-in',
        pattern: 'arithmetic',
        objective: 'Practice integer floor division',
        targets: null,
        template: 'result = 10 ___ 3',
        blankPosition: 13,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
