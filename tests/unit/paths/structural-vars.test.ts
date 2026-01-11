// tests/unit/paths/structural-vars.test.ts
import { describe, it, expect } from 'vitest';
import { loadSkins } from '@/lib/paths/loader';

const REQUIRED_STRUCTURAL_VARS = [
  'list_name',
  'item_singular',
  'item_plural',
  'item_examples',
  'record_keys',
  'attr_key_1',
  'attr_key_2',
  'id_var',
] as const;

describe('Skin Structural Variables', () => {
  it('all skins have required structural variables', async () => {
    const skins = await loadSkins();
    const issues: string[] = [];

    for (const skin of skins) {
      for (const varName of REQUIRED_STRUCTURAL_VARS) {
        const value = skin.vars[varName];
        if (value === undefined || value === null || value === '') {
          issues.push(`${skin.id}: missing ${varName}`);
        }
      }
    }

    expect(issues, `Missing structural vars:\n${issues.join('\n')}`).toHaveLength(0);
  });

  it('item_examples has at least 3 values', async () => {
    const skins = await loadSkins();
    const issues: string[] = [];

    for (const skin of skins) {
      const examples = skin.vars.item_examples;
      if (!Array.isArray(examples) || examples.length < 3) {
        issues.push(`${skin.id}: item_examples needs 3+ values, has ${examples?.length ?? 0}`);
      }
    }

    expect(issues, `Insufficient item_examples:\n${issues.join('\n')}`).toHaveLength(0);
  });

  it('record_keys has at least 2 values', async () => {
    const skins = await loadSkins();
    const issues: string[] = [];

    for (const skin of skins) {
      const keys = skin.vars.record_keys;
      if (!Array.isArray(keys) || keys.length < 2) {
        issues.push(`${skin.id}: record_keys needs 2+ values, has ${keys?.length ?? 0}`);
      }
    }

    expect(issues, `Insufficient record_keys:\n${issues.join('\n')}`).toHaveLength(0);
  });
});
