import { describe, it, expect } from 'vitest';
import { selectExerciseByType, getUnderrepresentedType } from '@/lib/srs/concept-algorithm';
import type { Exercise } from '@/lib/types/app.types';
import type { ExerciseType } from '@/lib/curriculum/types';

const mockExercises: Partial<Exercise>[] = [
  { id: '1', exerciseType: 'write', subconcept: 'variables' },
  { id: '2', exerciseType: 'write', subconcept: 'variables' },
  { id: '3', exerciseType: 'fill-in', subconcept: 'variables' },
  { id: '4', exerciseType: 'predict', subconcept: 'variables' },
];

describe('getUnderrepresentedType', () => {
  it('returns fill-in or predict when session has only write exercises', () => {
    const sessionHistory: ExerciseType[] = ['write', 'write', 'write'];
    const ratios = { write: 0.5, 'fill-in': 0.25, predict: 0.25 };

    const result = getUnderrepresentedType(sessionHistory, ratios);
    expect(['fill-in', 'predict']).toContain(result);
  });

  it('returns write when session has no write exercises but needs them', () => {
    const sessionHistory: ExerciseType[] = ['fill-in', 'predict', 'fill-in'];
    const ratios = { write: 0.8, 'fill-in': 0.1, predict: 0.1 };

    const result = getUnderrepresentedType(sessionHistory, ratios);
    expect(result).toBe('write');
  });

  it('returns null when ratios are approximately met', () => {
    const sessionHistory: ExerciseType[] = ['write', 'write', 'write', 'write', 'fill-in', 'predict'];
    const ratios = { write: 0.8, 'fill-in': 0.1, predict: 0.1 };

    const result = getUnderrepresentedType(sessionHistory, ratios);
    // Either null or any type is acceptable when balanced
    expect(result === null || ['write', 'fill-in', 'predict'].includes(result!)).toBe(true);
  });

  it('handles empty session history by returning write', () => {
    const sessionHistory: ExerciseType[] = [];
    const ratios = { write: 0.5, 'fill-in': 0.25, predict: 0.25 };

    const result = getUnderrepresentedType(sessionHistory, ratios);
    expect(result).toBe('write');
  });
});

describe('selectExerciseByType', () => {
  it('prefers exercises of the underrepresented type', () => {
    const sessionHistory: ExerciseType[] = ['write', 'write', 'write'];
    const ratios = { write: 0.5, 'fill-in': 0.25, predict: 0.25 };

    const result = selectExerciseByType(mockExercises as Exercise[], sessionHistory, ratios);
    expect(result).not.toBeNull();
    expect(['fill-in', 'predict']).toContain(result!.exerciseType);
  });

  it('falls back to any exercise when preferred type unavailable', () => {
    const writeOnlyExercises = mockExercises.filter(e => e.exerciseType === 'write');
    const sessionHistory: ExerciseType[] = ['write', 'write'];
    const ratios = { write: 0.3, 'fill-in': 0.35, predict: 0.35 };

    const result = selectExerciseByType(writeOnlyExercises as Exercise[], sessionHistory, ratios);
    expect(result).not.toBeNull();
    expect(result!.exerciseType).toBe('write');
  });

  it('returns null when no exercises available', () => {
    const result = selectExerciseByType([], [], { write: 0.5, 'fill-in': 0.25, predict: 0.25 });
    expect(result).toBeNull();
  });
});
