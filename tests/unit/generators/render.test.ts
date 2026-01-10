// tests/unit/generators/render.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderExercise, renderExercises, type RenderableExercise } from '@/lib/generators/render';
import { registerGenerator, type Generator } from '@/lib/generators';
import type { Skin, SkinVars } from '@/lib/paths/types';

// Mock generator for testing
const mockGenerator: Generator = {
  name: 'test-render-gen',
  generate: () => ({ start: 2, end: 6, name: 'test' }),
  validate: () => true,
};

beforeEach(() => {
  // Register mock generator
  registerGenerator(mockGenerator);
});

describe('renderExercise', () => {
  const baseExercise: RenderableExercise = {
    slug: 'test-exercise',
    prompt: 'Static prompt',
    expectedAnswer: 'static answer',
    acceptedSolutions: [],
  };

  it('passes through static exercises unchanged', () => {
    const result = renderExercise(baseExercise, 'user-1', new Date());
    expect(result.prompt).toBe('Static prompt');
    expect(result.expectedAnswer).toBe('static answer');
    expect(result._generatedParams).toBeUndefined();
    expect(result._seed).toBeUndefined();
  });

  it('renders templates with generated params', () => {
    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'test-render-gen',
      prompt: 'Get chars from {{start}} to {{end}}',
      expectedAnswer: 's[{{start}}:{{end}}]',
    };

    const result = renderExercise(exercise, 'user-1', new Date('2026-01-15'));

    expect(result.prompt).toBe('Get chars from 2 to 6');
    expect(result.expectedAnswer).toBe('s[2:6]');
    expect(result._generatedParams).toEqual({ start: 2, end: 6, name: 'test' });
    expect(result._seed).toBeDefined();
  });

  it('renders acceptedSolutions templates', () => {
    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'test-render-gen',
      prompt: 'Test',
      expectedAnswer: 's[{{start}}:{{end}}]',
      acceptedSolutions: ['s[{{start}}:{{end}}]', '{{name}}[{{start}}:{{end}}]'],
    };

    const result = renderExercise(exercise, 'user-1', new Date('2026-01-15'));

    expect(result.acceptedSolutions).toEqual(['s[2:6]', 'test[2:6]']);
  });

  it('renders code template for predict exercises', () => {
    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'test-render-gen',
      code: 'print(s[{{start}}:{{end}}])',
      expectedAnswer: '{{name}}',
    };

    const result = renderExercise(exercise, 'user-1', new Date('2026-01-15'));

    expect(result.code).toBe('print(s[2:6])');
    expect(result.expectedAnswer).toBe('test');
  });

  it('renders template for fill-in exercises', () => {
    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'test-render-gen',
      template: 'result = s[___:{{end}}]',
      expectedAnswer: '{{start}}',
    };

    const result = renderExercise(exercise, 'user-1', new Date('2026-01-15'));

    expect(result.template).toBe('result = s[___:6]');
    expect(result.expectedAnswer).toBe('2');
  });

  it('warns and passes through for unknown generator', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'non-existent',
      prompt: 'Template {{value}}',
      expectedAnswer: '{{value}}',
    };

    const result = renderExercise(exercise, 'user-1', new Date());

    expect(result.prompt).toBe('Template {{value}}');
    expect(result._generatedParams).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('non-existent'));

    warnSpy.mockRestore();
  });

  it('produces same output for same (user, exercise, date)', () => {
    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'test-render-gen',
      prompt: 'Index {{start}}',
      expectedAnswer: '{{start}}',
    };

    const date = new Date('2026-01-15');
    const result1 = renderExercise(exercise, 'user-123', date);
    const result2 = renderExercise(exercise, 'user-123', date);

    expect(result1.prompt).toBe(result2.prompt);
    expect(result1._seed).toBe(result2._seed);
  });

  it('produces different output for different users', () => {
    // Need a generator that actually varies
    const varyingGenerator: Generator = {
      name: 'varying-gen',
      generate: (seed) => {
        // Use seed to produce different values
        const num = seed.charCodeAt(0) % 10;
        return { value: num };
      },
      validate: () => true,
    };
    registerGenerator(varyingGenerator);

    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'varying-gen',
      prompt: 'Value: {{value}}',
      expectedAnswer: '{{value}}',
    };

    const date = new Date('2026-01-15');
    const result1 = renderExercise(exercise, 'user-aaa', date);
    const result2 = renderExercise(exercise, 'user-zzz', date);

    // Seeds should differ
    expect(result1._seed).not.toBe(result2._seed);
  });
});

describe('renderExercise with skin', () => {
  it('merges skin vars into template params', () => {
    const exercise: RenderableExercise = {
      slug: 'list-create-empty',
      prompt: 'Create an empty list called {{list_name}}',
      expectedAnswer: '{{list_name}} = []',
      acceptedSolutions: [],
    };

    const skinVars: SkinVars = {
      list_name: 'tasks',
      item_singular: 'task',
      item_plural: 'tasks',
      item_examples: ['buy groceries'],
      record_keys: ['title', 'done'],
    };

    const result = renderExercise(exercise, 'user-1', new Date(), skinVars);

    expect(result.prompt).toBe('Create an empty list called tasks');
    expect(result.expectedAnswer).toBe('tasks = []');
  });

  it('derives item_example from item_examples array', () => {
    const exercise: RenderableExercise = {
      slug: 'list-in-check',
      prompt: 'Check if "{{item_example}}" is in {{list_name}}',
      expectedAnswer: '"{{item_example}}" in {{list_name}}',
      acceptedSolutions: [],
    };

    const skinVars: SkinVars = {
      list_name: 'tasks',
      item_singular: 'task',
      item_plural: 'tasks',
      item_examples: ['buy groceries', 'call mom', 'email boss'],
      record_keys: ['title', 'done'],
    };

    const result = renderExercise(exercise, 'user-1', new Date(), skinVars);

    // item_example should be derived from item_examples (deterministic per slug)
    expect(result.prompt).toMatch(/Check if "(buy groceries|call mom|email boss)" is in tasks/);
    expect(result.expectedAnswer).toMatch(/"(buy groceries|call mom|email boss)" in tasks/);
    // Should be deterministic - same slug always gets same item
    const result2 = renderExercise(exercise, 'user-2', new Date(), skinVars);
    expect(result.prompt).toBe(result2.prompt);
  });

  it('handles empty item_examples array gracefully', () => {
    const exercise: RenderableExercise = {
      slug: 'empty-examples',
      prompt: 'Example: {{item_example}}',
      expectedAnswer: '{{item_example}}',
      acceptedSolutions: [],
    };

    const skinVars: SkinVars = {
      list_name: 'items',
      item_singular: 'item',
      item_plural: 'items',
      item_examples: [], // Empty array
      record_keys: [],
    };

    const result = renderExercise(exercise, 'user-1', new Date(), skinVars);

    // With empty array, {{item_example}} should remain unrendered
    expect(result.prompt).toBe('Example: ');
    expect(result.expectedAnswer).toBe('');
  });

  it('returns exercise unchanged when no skin vars and no generator', () => {
    const exercise: RenderableExercise = {
      slug: 'static-exercise',
      prompt: 'Static prompt',
      expectedAnswer: 'static',
      acceptedSolutions: [],
    };

    const result = renderExercise(exercise, 'user-1', new Date());

    expect(result.prompt).toBe('Static prompt');
    expect(result.expectedAnswer).toBe('static');
  });

  it('renders all template fields with skin vars', () => {
    const exercise: RenderableExercise = {
      slug: 'skinned-exercise',
      prompt: 'Add a {{item_singular}} to {{list_name}}',
      expectedAnswer: '{{list_name}}.append("{{item_singular}}")',
      acceptedSolutions: ['{{list_name}} += ["{{item_singular}}"]'],
      hints: ['Use {{list_name}}.append()'],
      code: '{{list_name}} = []',
      template: '{{list_name}}.___("{{item_singular}}")',
    };

    const skinVars: SkinVars = {
      list_name: 'playlist',
      item_singular: 'song',
      item_plural: 'songs',
      item_examples: ['Bohemian Rhapsody'],
      record_keys: ['title', 'artist'],
    };

    const result = renderExercise(exercise, 'user-1', new Date(), skinVars);

    expect(result.prompt).toBe('Add a song to playlist');
    expect(result.expectedAnswer).toBe('playlist.append("song")');
    expect(result.acceptedSolutions).toEqual(['playlist += ["song"]']);
    expect(result.hints).toEqual(['Use playlist.append()']);
    expect(result.code).toBe('playlist = []');
    expect(result.template).toBe('playlist.___("song")');
  });

  it('generator params override skin vars on collision', () => {
    const exercise: RenderableExercise = {
      slug: 'collision-test',
      generator: 'test-render-gen',
      prompt: 'Name is {{name}}, start is {{start}}',
      expectedAnswer: '{{name}}',
      acceptedSolutions: [],
    };

    const skinVars: SkinVars = {
      list_name: 'items',
      item_singular: 'item',
      item_plural: 'items',
      item_examples: ['example'],
      record_keys: ['key'],
      name: 'from-skin', // This should be overridden by generator
      start: '999', // This should be overridden by generator
    };

    const result = renderExercise(exercise, 'user-1', new Date('2026-01-15'), skinVars);

    // Generator produces { start: 2, end: 6, name: 'test' }
    // Generator params should override skin vars
    expect(result.prompt).toBe('Name is test, start is 2');
    expect(result.expectedAnswer).toBe('test');
  });

  it('combines skin vars with generator params', () => {
    const exercise: RenderableExercise = {
      slug: 'combined-test',
      generator: 'test-render-gen',
      prompt: '{{list_name}}[{{start}}:{{end}}]',
      expectedAnswer: '{{list_name}}[{{start}}:{{end}}]',
      acceptedSolutions: [],
    };

    const skinVars: SkinVars = {
      list_name: 'tasks',
      item_singular: 'task',
      item_plural: 'tasks',
      item_examples: ['example'],
      record_keys: ['key'],
    };

    const result = renderExercise(exercise, 'user-1', new Date('2026-01-15'), skinVars);

    // Generator provides start/end, skin provides list_name
    expect(result.prompt).toBe('tasks[2:6]');
    expect(result.expectedAnswer).toBe('tasks[2:6]');
  });
});

describe('renderExercises with skins', () => {
  it('applies skins to matching exercises', () => {
    const exercises: RenderableExercise[] = [
      {
        slug: 'ex-1',
        prompt: 'Create {{list_name}}',
        expectedAnswer: '{{list_name}} = []',
        acceptedSolutions: [],
      },
      {
        slug: 'ex-2',
        prompt: 'Static prompt',
        expectedAnswer: 'static',
        acceptedSolutions: [],
      },
    ];

    const skins: (Skin | null)[] = [
      {
        id: 'task-manager',
        title: 'Task Manager',
        icon: '✅',
        blueprints: [],
        vars: {
          list_name: 'tasks',
          item_singular: 'task',
          item_plural: 'tasks',
          item_examples: [],
          record_keys: [],
        },
        contexts: {},
      },
      null, // No skin for second exercise
    ];

    const results = renderExercises(exercises, 'user-1', new Date(), skins);

    expect(results[0].prompt).toBe('Create tasks');
    expect(results[1].prompt).toBe('Static prompt');
  });

  it('handles empty skins array', () => {
    const exercises: RenderableExercise[] = [
      {
        slug: 'ex-1',
        prompt: 'Static {{thing}}',
        expectedAnswer: 'answer',
        acceptedSolutions: [],
      },
    ];

    const results = renderExercises(exercises, 'user-1', new Date(), []);

    expect(results[0].prompt).toBe('Static {{thing}}'); // Template not rendered
  });

  it('handles undefined skins parameter', () => {
    const exercises: RenderableExercise[] = [
      {
        slug: 'ex-1',
        prompt: 'Static prompt',
        expectedAnswer: 'answer',
        acceptedSolutions: [],
      },
    ];

    const results = renderExercises(exercises, 'user-1', new Date());

    expect(results[0].prompt).toBe('Static prompt');
  });

  it('applies dataPack from skins to exercises', () => {
    const exercises: RenderableExercise[] = [
      {
        slug: 'predict-ex',
        prompt: 'What does this output?',
        code: 'print(items[0])',
        expectedAnswer: '{{list_sample.0}}',
        acceptedSolutions: [],
      },
    ];

    const skins: (Skin | null)[] = [
      {
        id: 'fantasy-game',
        title: 'Fantasy Game',
        icon: '⚔️',
        vars: {
          list_name: 'inventory',
          item_singular: 'item',
          item_plural: 'items',
          item_examples: [],
          record_keys: [],
        },
        contexts: {},
        dataPack: {
          list_sample: ['sword', 'shield', 'potion'],
          dict_sample: { name: 'Excalibur', rarity: 'legendary' },
          records_sample: [{ name: 'sword', damage: 10 }],
          string_samples: ['Quest accepted!'],
        },
      },
    ];

    const results = renderExercises(exercises, 'user-1', new Date(), skins);

    expect(results[0].expectedAnswer).toBe('sword');
  });
});

describe('renderExercise with dataPack', () => {
  const baseSkinVars: SkinVars = {
    list_name: 'inventory',
    item_singular: 'item',
    item_plural: 'items',
    item_examples: [],
    record_keys: [],
  };

  it('renders list_sample array values in templates', () => {
    const exercise: RenderableExercise = {
      slug: 'predict-list',
      prompt: 'What is the first item?',
      code: 'items = {{#list_sample}}["{{.}}", {{/list_sample}}]\nprint(items[0])',
      expectedAnswer: '{{list_sample.0}}',
      acceptedSolutions: [],
    };

    const dataPack = {
      list_sample: ['sword', 'shield', 'potion'],
      dict_sample: { name: 'Excalibur' },
      records_sample: [],
      string_samples: [],
    };

    const result = renderExercise(exercise, 'user-1', new Date(), baseSkinVars, dataPack);

    expect(result.expectedAnswer).toBe('sword');
  });

  it('renders dict_sample values in templates', () => {
    const exercise: RenderableExercise = {
      slug: 'predict-dict',
      prompt: 'What is the item name?',
      code: 'item = {"name": "{{dict_sample.name}}", "rarity": "{{dict_sample.rarity}}"}\nprint(item["name"])',
      expectedAnswer: '{{dict_sample.name}}',
      acceptedSolutions: [],
    };

    const dataPack = {
      list_sample: [],
      dict_sample: { name: 'Excalibur', rarity: 'legendary' },
      records_sample: [],
      string_samples: [],
    };

    const result = renderExercise(exercise, 'user-1', new Date(), baseSkinVars, dataPack);

    expect(result.expectedAnswer).toBe('Excalibur');
    expect(result.code).toContain('"name": "Excalibur"');
    expect(result.code).toContain('"rarity": "legendary"');
  });

  it('renders string_samples in templates', () => {
    const exercise: RenderableExercise = {
      slug: 'predict-string',
      prompt: 'What message appears?',
      code: 'print("{{string_samples.0}}")',
      expectedAnswer: '{{string_samples.0}}',
      acceptedSolutions: [],
    };

    const dataPack = {
      list_sample: [],
      dict_sample: {},
      records_sample: [],
      string_samples: ['Quest accepted!', 'Level up!'],
    };

    const result = renderExercise(exercise, 'user-1', new Date(), baseSkinVars, dataPack);

    expect(result.expectedAnswer).toBe('Quest accepted!');
    expect(result.code).toBe('print("Quest accepted!")');
  });

  it('skinVars take precedence over dataPack on collision', () => {
    const exercise: RenderableExercise = {
      slug: 'collision-test',
      prompt: 'List name is {{list_name}}',
      expectedAnswer: '{{list_name}}',
      acceptedSolutions: [],
    };

    const skinVars: SkinVars = {
      ...baseSkinVars,
      list_name: 'tasks', // This should win
    };

    const dataPack = {
      list_sample: [],
      dict_sample: {},
      records_sample: [],
      string_samples: [],
      list_name: 'inventory', // This should be overridden (via spread)
    };

    const result = renderExercise(exercise, 'user-1', new Date(), skinVars, dataPack as never);

    expect(result.prompt).toBe('List name is tasks');
    expect(result.expectedAnswer).toBe('tasks');
  });

  it('passes through exercise unchanged when no dataPack and no skinVars', () => {
    const exercise: RenderableExercise = {
      slug: 'static-ex',
      prompt: 'Static prompt with {{template}}',
      expectedAnswer: '{{answer}}',
      acceptedSolutions: [],
    };

    const result = renderExercise(exercise, 'user-1', new Date());

    expect(result.prompt).toBe('Static prompt with {{template}}');
    expect(result.expectedAnswer).toBe('{{answer}}');
  });

  it('renders with only dataPack (no skinVars)', () => {
    const exercise: RenderableExercise = {
      slug: 'datapack-only',
      prompt: 'First item: {{list_sample.0}}',
      expectedAnswer: '{{list_sample.0}}',
      acceptedSolutions: [],
    };

    const dataPack = {
      list_sample: ['apple', 'banana'],
      dict_sample: {},
      records_sample: [],
      string_samples: [],
    };

    const result = renderExercise(exercise, 'user-1', new Date(), undefined, dataPack);

    expect(result.prompt).toBe('First item: apple');
    expect(result.expectedAnswer).toBe('apple');
  });

  it('combines skinVars and dataPack for predict exercises', () => {
    const exercise: RenderableExercise = {
      slug: 'combined-predict',
      prompt: 'What does {{list_name}}[0] return?',
      code: '{{list_name}} = {{#list_sample}}["{{.}}", {{/list_sample}}]\nprint({{list_name}}[0])',
      expectedAnswer: '{{list_sample.0}}',
      acceptedSolutions: [],
    };

    const skinVars: SkinVars = {
      ...baseSkinVars,
      list_name: 'inventory',
    };

    const dataPack = {
      list_sample: ['sword', 'shield'],
      dict_sample: {},
      records_sample: [],
      string_samples: [],
    };

    const result = renderExercise(exercise, 'user-1', new Date(), skinVars, dataPack);

    expect(result.prompt).toBe('What does inventory[0] return?');
    expect(result.expectedAnswer).toBe('sword');
  });
});
