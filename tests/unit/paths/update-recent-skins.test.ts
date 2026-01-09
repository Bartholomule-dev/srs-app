import { describe, it, expect } from 'vitest';
import { computeNewRecentSkins } from '@/lib/paths/update-recent-skins';

describe('updateRecentSkins', () => {
  describe('computeNewRecentSkins', () => {
    it('adds new skin to list', () => {
      const current = ['skin-1', 'skin-2'];
      const result = computeNewRecentSkins(current, 'skin-3');

      expect(result).toEqual(['skin-1', 'skin-2', 'skin-3']);
    });

    it('limits to 10 skins max', () => {
      const current = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'];
      const result = computeNewRecentSkins(current, 'new-skin');

      expect(result.length).toBe(10);
      expect(result[0]).toBe('s2'); // Oldest removed
      expect(result[9]).toBe('new-skin');
    });

    it('does not add duplicates - moves to end instead', () => {
      const current = ['skin-1', 'skin-2'];
      const result = computeNewRecentSkins(current, 'skin-1');

      // Should move to end instead of duplicating
      expect(result).toEqual(['skin-2', 'skin-1']);
    });

    it('handles null skin gracefully', () => {
      const current = ['skin-1'];
      const result = computeNewRecentSkins(current, null);

      expect(result).toEqual(['skin-1']);
    });

    it('handles empty current list', () => {
      const result = computeNewRecentSkins([], 'new-skin');

      expect(result).toEqual(['new-skin']);
    });

    it('returns same array reference when skin is null', () => {
      const current = ['skin-1'];
      const result = computeNewRecentSkins(current, null);

      expect(result).toBe(current); // Same reference
    });
  });
});
