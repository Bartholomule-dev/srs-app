import { describe, it, expect } from 'vitest';
import { getTargetsToCredit, getTargetsToPenalize } from '@/lib/srs/multi-target';

describe('multi-target credit logic', () => {
  describe('getTargetsToCredit', () => {
    it('returns all targets on success', () => {
      const targets = ['for', 'if', 'list-comp'];
      const result = getTargetsToCredit(targets, 'list-comp', true);
      expect(result).toEqual(['for', 'if', 'list-comp']);
    });

    it('returns primary subconcept when no targets', () => {
      const result = getTargetsToCredit(null, 'for', true);
      expect(result).toEqual(['for']);
    });

    it('returns primary subconcept when targets is empty', () => {
      const result = getTargetsToCredit([], 'for', true);
      expect(result).toEqual(['for']);
    });

    it('returns empty array on failure', () => {
      const targets = ['for', 'if', 'list-comp'];
      const result = getTargetsToCredit(targets, 'list-comp', false);
      expect(result).toEqual([]);
    });
  });

  describe('getTargetsToPenalize', () => {
    it('returns only primary subconcept on failure', () => {
      const targets = ['for', 'if', 'list-comp'];
      const result = getTargetsToPenalize(targets, 'list-comp', false);
      expect(result).toEqual(['list-comp']);
    });

    it('uses first target as primary when available', () => {
      const targets = ['for', 'if', 'list-comp'];
      const result = getTargetsToPenalize(targets, 'other', false);
      expect(result).toEqual(['for']);
    });

    it('returns primary subconcept when no targets', () => {
      const result = getTargetsToPenalize(null, 'for', false);
      expect(result).toEqual(['for']);
    });

    it('returns empty array on success', () => {
      const targets = ['for', 'if', 'list-comp'];
      const result = getTargetsToPenalize(targets, 'list-comp', true);
      expect(result).toEqual([]);
    });
  });
});
