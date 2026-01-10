// scripts/validate-templates.ts
// Validates that all Mustache templates used in exercises have corresponding definitions
// - Static exercises: all templates must come from skin vars
// - Dynamic exercises: templates can come from generators (runtime) or skin vars
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import yaml from 'js-yaml';

const EXERCISES_DIR = join(process.cwd(), 'exercises', 'python');
const SKINS_DIR = join(process.cwd(), 'paths', 'python', 'skins');

// Regex to match Mustache templates: {{variable_name}}
const TEMPLATE_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

// Derived skin variables (computed at runtime from other skin vars)
// These are NOT in skin YAML files but are derived in src/lib/generators/render.ts
const DERIVED_SKIN_VARS = new Set([
  'item_example', // Derived from item_examples array (random element per exercise)
]);

// Known generator variables (produced at runtime by dynamic exercise generators)
// These are NOT expected to be in skin files
const KNOWN_GENERATOR_VARS = new Set([
  // Common iteration/index vars
  'a', 'b', 'c', 'd', 'e', 'x', 'y', 'z', 'n', 'm', 'i', 'idx', 'index',
  // Arithmetic results
  'sum', 'product', 'result', 'mod', 'value',
  // Slice/range parameters
  'start', 'end', 'stop', 'step', 'length',
  // Function/method generated
  'func', 'funcName', 'method', 'methodCall', 'params', 'argList', 'callArgs',
  'operation', 'operationName', 'op', 'opName', 'expression',
  // String operations
  'word', 'original', 'input', 'inputStr', 'output', 'outputStr', 'outputCount',
  'resultStr', 'fstring',
  // Type/value params
  'varName', 'name', 'valueStr', 'isTruthy', 'explanation',
  'conversionCall', 'inputValue', 'targetType',
  // Collection params
  'list', 'key', 'dict_str', 'dataStr', 'accessExpr', 'tuple', 'tupleVar',
  'set1', 'set2',
  // OOP params
  'className', 'childClass', 'parentClass', 'callOn', 'attribute', 'personName',
  // Error handling
  'exceptionType', 'catchBlock', 'code', 'context',
  // Lambda/comprehension
  'lambdaExpr',
  // File/path operations
  'fullPath', 'parent', 'stem', 'suffix', 'content', 'mode',
  // Template/description (often generator-provided)
  'description',
]);

interface ExerciseEntry {
  slug: string;
  prompt?: string;
  expected_answer?: string;
  accepted_solutions?: string[];
  hints?: string[];
  template?: string;
  generator?: string; // If present, exercise is dynamic
  [key: string]: unknown;
}

interface ExerciseFile {
  exercises: ExerciseEntry[];
}

interface SkinFile {
  id: string;
  vars: Record<string, unknown>;
}

interface TemplateUsage {
  template: string;
  exerciseSlug: string;
  field: string;
  file: string;
  isDynamic: boolean; // Whether this exercise has a generator
}

/**
 * Extract all template variables from a string
 */
function extractTemplates(text: string): string[] {
  const templates: string[] = [];
  let match;
  // Reset regex lastIndex for safety
  TEMPLATE_REGEX.lastIndex = 0;
  while ((match = TEMPLATE_REGEX.exec(text)) !== null) {
    templates.push(match[1]);
  }
  return templates;
}

/**
 * Extract templates from an exercise entry, tracking where they came from
 */
function extractExerciseTemplates(
  exercise: ExerciseEntry,
  file: string
): TemplateUsage[] {
  const usages: TemplateUsage[] = [];
  const isDynamic = !!exercise.generator;

  const fieldsToCheck = [
    'prompt',
    'expected_answer',
    'template',
  ];

  for (const field of fieldsToCheck) {
    const value = exercise[field];
    if (typeof value === 'string') {
      for (const template of extractTemplates(value)) {
        usages.push({
          template,
          exerciseSlug: exercise.slug,
          field,
          file,
          isDynamic,
        });
      }
    }
  }

  // Check arrays
  if (exercise.accepted_solutions) {
    for (const solution of exercise.accepted_solutions) {
      if (typeof solution === 'string') {
        for (const template of extractTemplates(solution)) {
          usages.push({
            template,
            exerciseSlug: exercise.slug,
            field: 'accepted_solutions',
            file,
            isDynamic,
          });
        }
      }
    }
  }

  if (exercise.hints) {
    for (const hint of exercise.hints) {
      if (typeof hint === 'string') {
        for (const template of extractTemplates(hint)) {
          usages.push({
            template,
            exerciseSlug: exercise.slug,
            field: 'hints',
            file,
            isDynamic,
          });
        }
      }
    }
  }

  return usages;
}

/**
 * Load all template usages from exercise files
 */
async function loadExerciseTemplates(): Promise<TemplateUsage[]> {
  const usages: TemplateUsage[] = [];

  const files = await readdir(EXERCISES_DIR);
  const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  for (const file of yamlFiles) {
    const content = await readFile(join(EXERCISES_DIR, file), 'utf-8');
    const data = yaml.load(content) as ExerciseFile;

    if (data?.exercises && Array.isArray(data.exercises)) {
      for (const ex of data.exercises) {
        usages.push(...extractExerciseTemplates(ex, file));
      }
    }
  }

  return usages;
}

/**
 * Load all defined variables from skin files
 */
async function loadSkinVariables(): Promise<Map<string, Set<string>>> {
  const skinVars = new Map<string, Set<string>>();

  const files = await readdir(SKINS_DIR);
  const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  for (const file of yamlFiles) {
    const content = await readFile(join(SKINS_DIR, file), 'utf-8');
    const data = yaml.load(content) as SkinFile;

    if (data?.vars) {
      const vars = new Set<string>(Object.keys(data.vars));
      skinVars.set(data.id || file, vars);
    }
  }

  return skinVars;
}

/**
 * Get the union of all variables defined across all skins
 */
function getAllDefinedVariables(skinVars: Map<string, Set<string>>): Set<string> {
  const allVars = new Set<string>();
  for (const vars of skinVars.values()) {
    for (const v of vars) {
      allVars.add(v);
    }
  }
  return allVars;
}

async function main() {
  console.log('Validating exercise templates against skin definitions...\n');

  let errors = 0;
  let warnings = 0;

  try {
    // Load all template usages
    const usages = await loadExerciseTemplates();
    const uniqueTemplates = new Set(usages.map(u => u.template));
    const dynamicUsages = usages.filter(u => u.isDynamic);
    const staticUsages = usages.filter(u => !u.isDynamic);

    console.log(`Found ${usages.length} template usages (${uniqueTemplates.size} unique variables)`);
    console.log(`  - Static exercises: ${staticUsages.length} usages`);
    console.log(`  - Dynamic exercises: ${dynamicUsages.length} usages`);

    // Load all skin variables
    const skinVars = await loadSkinVariables();
    console.log(`Loaded ${skinVars.size} skins\n`);

    // Get union of all defined variables
    const allDefinedVars = getAllDefinedVariables(skinVars);
    console.log(`Skin variables: ${[...allDefinedVars].sort().join(', ')}\n`);

    // Track issues
    const undefinedInStatic = new Map<string, TemplateUsage[]>(); // Real errors
    const undefinedInDynamic = new Map<string, TemplateUsage[]>(); // Expected (generator vars)
    const unknownInDynamic = new Map<string, TemplateUsage[]>(); // Warnings (not skin OR known generator)
    const partialCoverage = new Map<string, string[]>(); // Skin var missing from some skins

    for (const usage of usages) {
      const inSkins = allDefinedVars.has(usage.template);
      const isDerivedSkinVar = DERIVED_SKIN_VARS.has(usage.template);
      const isGeneratorVar = KNOWN_GENERATOR_VARS.has(usage.template);

      if (!inSkins && !isDerivedSkinVar) {
        if (!usage.isDynamic) {
          // Static exercise using undefined template - ERROR
          if (!undefinedInStatic.has(usage.template)) {
            undefinedInStatic.set(usage.template, []);
          }
          undefinedInStatic.get(usage.template)!.push(usage);
        } else if (isGeneratorVar) {
          // Dynamic exercise using known generator var - expected
          if (!undefinedInDynamic.has(usage.template)) {
            undefinedInDynamic.set(usage.template, []);
          }
          undefinedInDynamic.get(usage.template)!.push(usage);
        } else {
          // Dynamic exercise using unknown var - might be missing from both
          if (!unknownInDynamic.has(usage.template)) {
            unknownInDynamic.set(usage.template, []);
          }
          unknownInDynamic.get(usage.template)!.push(usage);
        }
      } else if (inSkins) {
        // Check partial coverage (only for actual skin vars, not derived)
        const missingSkins: string[] = [];
        for (const [skinId, vars] of skinVars) {
          if (!vars.has(usage.template)) {
            missingSkins.push(skinId);
          }
        }
        if (missingSkins.length > 0 && !partialCoverage.has(usage.template)) {
          partialCoverage.set(usage.template, missingSkins);
        }
      }
    }

    // Report undefined templates in STATIC exercises (ERROR)
    if (undefinedInStatic.size > 0) {
      console.log('=== ERRORS: Undefined templates in STATIC exercises ===');
      console.log('These templates are used but not defined in any skin:\n');
      for (const [template, templateUsages] of undefinedInStatic) {
        errors++;
        console.log(`  {{${template}}}:`);
        const byExercise = new Map<string, TemplateUsage[]>();
        for (const u of templateUsages) {
          if (!byExercise.has(u.exerciseSlug)) byExercise.set(u.exerciseSlug, []);
          byExercise.get(u.exerciseSlug)!.push(u);
        }
        for (const [slug, exUsages] of byExercise) {
          const fields = [...new Set(exUsages.map(u => u.field))].join(', ');
          console.log(`    - ${slug}: ${fields}`);
        }
      }
      console.log();
    }

    // Report unknown variables in dynamic exercises (WARNING)
    if (unknownInDynamic.size > 0) {
      console.log('=== WARNINGS: Unknown templates in DYNAMIC exercises ===');
      console.log('These are not in skins AND not in known generator vars list.');
      console.log('Either add to skin vars, or add to KNOWN_GENERATOR_VARS:\n');
      for (const [template, templateUsages] of unknownInDynamic) {
        warnings++;
        console.log(`  {{${template}}}:`);
        const byExercise = new Map<string, TemplateUsage[]>();
        for (const u of templateUsages) {
          if (!byExercise.has(u.exerciseSlug)) byExercise.set(u.exerciseSlug, []);
          byExercise.get(u.exerciseSlug)!.push(u);
        }
        for (const [slug, exUsages] of byExercise) {
          const fields = [...new Set(exUsages.map(u => u.field))].join(', ');
          console.log(`    - ${slug}: ${fields}`);
        }
      }
      console.log();
    }

    // Report partial skin coverage (INFO)
    if (partialCoverage.size > 0) {
      console.log('=== INFO: Partial skin coverage ===');
      console.log('These skin vars are defined in some skins but not all:\n');
      for (const [template, missingSkins] of partialCoverage) {
        console.log(`  {{${template}}}: missing in ${missingSkins.slice(0, 5).join(', ')}${missingSkins.length > 5 ? ` (+${missingSkins.length - 5} more)` : ''}`);
      }
      console.log();
    }

    // Summary
    console.log('---');
    console.log('\nTemplate usage summary:');
    const templateCounts = new Map<string, { total: number; static: number; dynamic: number }>();
    for (const usage of usages) {
      if (!templateCounts.has(usage.template)) {
        templateCounts.set(usage.template, { total: 0, static: 0, dynamic: 0 });
      }
      const counts = templateCounts.get(usage.template)!;
      counts.total++;
      if (usage.isDynamic) counts.dynamic++;
      else counts.static++;
    }
    const sortedTemplates = [...templateCounts.entries()].sort((a, b) => b[1].total - a[1].total);

    for (const [template, counts] of sortedTemplates.slice(0, 20)) {
      const inSkins = allDefinedVars.has(template);
      const isDerivedSkinVar = DERIVED_SKIN_VARS.has(template);
      const isGeneratorVar = KNOWN_GENERATOR_VARS.has(template);

      let status: string;
      if (undefinedInStatic.has(template)) {
        status = '[ERROR]';
      } else if (unknownInDynamic.has(template)) {
        status = '[WARN]';
      } else if (inSkins) {
        status = '[SKIN]';
      } else if (isDerivedSkinVar) {
        status = '[DERIVED]';
      } else if (isGeneratorVar) {
        status = '[GEN]';
      } else {
        status = '[OK]';
      }

      console.log(`  ${status.padEnd(10)} {{${template}}}: ${counts.total} uses (${counts.static} static, ${counts.dynamic} dynamic)`);
    }
    if (sortedTemplates.length > 20) {
      console.log(`  ... and ${sortedTemplates.length - 20} more templates`);
    }

    // Final summary
    console.log('\n---');
    if (errors === 0 && warnings === 0) {
      console.log('All templates are properly defined!');
      process.exit(0);
    } else {
      if (errors > 0) {
        console.error(`${errors} ERRORS: templates undefined in static exercises`);
      }
      if (warnings > 0) {
        console.warn(`${warnings} WARNINGS: unknown templates in dynamic exercises`);
      }
      process.exit(errors > 0 ? 1 : 0);
    }
  } catch (err) {
    console.error('Validation failed:', err);
    process.exit(1);
  }
}

main();
