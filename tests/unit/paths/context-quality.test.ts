// tests/unit/paths/context-quality.test.ts
import { describe, it, expect } from 'vitest';
import { loadSkins } from '@/lib/paths/loader';

const PLACEHOLDER_PATTERNS = [
  /Use this step in the .* workflow/i,
  /\[TODO\]/i,
  /PLACEHOLDER/i,
];

describe('Skin Context Quality', () => {
  it('no contexts contain placeholder text', async () => {
    const skins = await loadSkins();
    const placeholders: string[] = [];

    for (const skin of skins) {
      for (const [exercise, context] of Object.entries(skin.contexts)) {
        for (const pattern of PLACEHOLDER_PATTERNS) {
          if (pattern.test(context)) {
            placeholders.push(`${skin.id}:${exercise}`);
            break;
          }
        }
      }
    }

    expect(
      placeholders.length,
      `Found ${placeholders.length} placeholder contexts:\n${placeholders.slice(0, 20).join('\n')}${placeholders.length > 20 ? '\n...' : ''}`
    ).toBe(0);
  });

  it('all contexts are at least 20 characters', async () => {
    const skins = await loadSkins();
    const short: string[] = [];

    for (const skin of skins) {
      for (const [exercise, context] of Object.entries(skin.contexts)) {
        if (context.length < 20) {
          short.push(`${skin.id}:${exercise} (${context.length} chars)`);
        }
      }
    }

    expect(short, `Short contexts:\n${short.join('\n')}`).toHaveLength(0);
  });
});
