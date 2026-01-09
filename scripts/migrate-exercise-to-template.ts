// scripts/migrate-exercise-to-template.ts
// Semi-automated helper for migrating static exercises to skin slot templates
//
// This script analyzes exercises and suggests Mustache template replacements.
// It outputs suggestions for human review - it does NOT auto-modify files.
//
// Usage:
//   npx tsx scripts/migrate-exercise-to-template.ts <exercise-slug>
//   npx tsx scripts/migrate-exercise-to-template.ts list-create-empty
//   npx tsx scripts/migrate-exercise-to-template.ts --all  # Scan all exercises

import { readFileSync, readdirSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';

const EXERCISES_DIR = join(process.cwd(), 'exercises', 'python');
const SKINS_DIR = join(process.cwd(), 'paths', 'python', 'skins');

interface Exercise {
  slug: string;
  title: string;
  prompt: string;
  template?: string;
  expected_answer: string;
  accepted_solutions?: string[];
  hints?: string[];
  code?: string;
  [key: string]: unknown;
}

interface YamlFile {
  exercises: Exercise[];
}

interface Suggestion {
  original: string;
  suggested: string;
  slot: string;
  context: 'prompt' | 'template' | 'answer' | 'code' | 'hints';
  confidence: 'high' | 'medium' | 'low';
}

// Pattern replacements map common hardcoded values to skin slot templates
// Organized by slot category for clarity
const REPLACEMENTS: {
  pattern: RegExp;
  replacement: string;
  slot: string;
  confidence: 'high' | 'medium' | 'low';
}[] = [
  // ====== Collection variable names ======
  // High confidence - these are very common and safe to replace
  { pattern: /\bitems\b/g, replacement: '{{list_name}}', slot: 'list_name', confidence: 'high' },
  { pattern: /\btasks\b/g, replacement: '{{list_name}}', slot: 'list_name', confidence: 'high' },
  { pattern: /\bcart\b/g, replacement: '{{list_name}}', slot: 'list_name', confidence: 'high' },
  { pattern: /\binventory\b/g, replacement: '{{list_name}}', slot: 'list_name', confidence: 'high' },
  { pattern: /\bplaylist\b/g, replacement: '{{list_name}}', slot: 'list_name', confidence: 'high' },
  { pattern: /\brecipes\b/g, replacement: '{{list_name}}', slot: 'list_name', confidence: 'high' },
  // Medium confidence - might be teaching generic list concepts
  { pattern: /\bmy_list\b/g, replacement: '{{list_name}}', slot: 'list_name', confidence: 'medium' },
  { pattern: /\blst\b/g, replacement: '{{list_name}}', slot: 'list_name', confidence: 'medium' },
  { pattern: /\bnumbers\b/g, replacement: '{{list_name}}', slot: 'list_name', confidence: 'low' },
  { pattern: /\bdata\b/g, replacement: '{{list_name}}', slot: 'list_name', confidence: 'low' },

  // ====== Item examples (string contexts) ======
  // Fruits - very common placeholder values
  { pattern: /"apple"/g, replacement: '"{{item_examples.[0]}}"', slot: 'item_examples', confidence: 'high' },
  { pattern: /'apple'/g, replacement: "'{{item_examples.[0]}}'", slot: 'item_examples', confidence: 'high' },
  { pattern: /"banana"/g, replacement: '"{{item_examples.[1]}}"', slot: 'item_examples', confidence: 'high' },
  { pattern: /'banana'/g, replacement: "'{{item_examples.[1]}}'", slot: 'item_examples', confidence: 'high' },
  { pattern: /"cherry"/g, replacement: '"{{item_examples.[2]}}"', slot: 'item_examples', confidence: 'high' },
  { pattern: /'cherry'/g, replacement: "'{{item_examples.[2]}}'", slot: 'item_examples', confidence: 'high' },
  { pattern: /"orange"/g, replacement: '"{{item_examples.[3]}}"', slot: 'item_examples', confidence: 'high' },
  { pattern: /'orange'/g, replacement: "'{{item_examples.[3]}}'", slot: 'item_examples', confidence: 'high' },
  // Task-like items
  { pattern: /"task1"/g, replacement: '"{{item_examples.[0]}}"', slot: 'item_examples', confidence: 'high' },
  { pattern: /"task2"/g, replacement: '"{{item_examples.[1]}}"', slot: 'item_examples', confidence: 'high' },
  { pattern: /"task"/g, replacement: '"{{item_singular}}"', slot: 'item_singular', confidence: 'medium' },
  { pattern: /"item"/g, replacement: '"{{item_singular}}"', slot: 'item_singular', confidence: 'medium' },

  // ====== Dictionary keys ======
  { pattern: /"name"/g, replacement: '"{{attr_key_1}}"', slot: 'attr_key_1', confidence: 'medium' },
  { pattern: /'name'/g, replacement: "'{{attr_key_1}}'", slot: 'attr_key_1', confidence: 'medium' },
  { pattern: /"price"/g, replacement: '"{{attr_key_2}}"', slot: 'attr_key_2', confidence: 'medium' },
  { pattern: /'price'/g, replacement: "'{{attr_key_2}}'", slot: 'attr_key_2', confidence: 'medium' },
  { pattern: /"title"/g, replacement: '"{{attr_key_1}}"', slot: 'attr_key_1', confidence: 'medium' },
  { pattern: /'title'/g, replacement: "'{{attr_key_1}}'", slot: 'attr_key_1', confidence: 'medium' },
  { pattern: /"done"/g, replacement: '"{{status_var}}"', slot: 'status_var', confidence: 'medium' },
  { pattern: /'done'/g, replacement: "'{{status_var}}'", slot: 'status_var', confidence: 'medium' },
  { pattern: /"completed"/g, replacement: '"{{status_var}}"', slot: 'status_var', confidence: 'medium' },
  { pattern: /"status"/g, replacement: '"{{status_var}}"', slot: 'status_var', confidence: 'medium' },

  // ====== Filenames ======
  { pattern: /"data\.txt"/g, replacement: '"{{filename}}"', slot: 'filename', confidence: 'high' },
  { pattern: /'data\.txt'/g, replacement: "'{{filename}}'", slot: 'filename', confidence: 'high' },
  { pattern: /"output\.txt"/g, replacement: '"{{filename}}"', slot: 'filename', confidence: 'high' },
  { pattern: /"tasks\.json"/g, replacement: '"{{filename}}"', slot: 'filename', confidence: 'high' },
  { pattern: /"file\.txt"/g, replacement: '"{{filename}}"', slot: 'filename', confidence: 'high' },
  { pattern: /"items\.json"/g, replacement: '"{{filename}}"', slot: 'filename', confidence: 'high' },

  // ====== Class/entity names (OOP) ======
  { pattern: /\bclass Task\b/g, replacement: 'class {{entity_name}}', slot: 'entity_name', confidence: 'medium' },
  { pattern: /\bclass Item\b/g, replacement: 'class {{entity_name}}', slot: 'entity_name', confidence: 'medium' },
  { pattern: /\bclass Product\b/g, replacement: 'class {{entity_name}}', slot: 'entity_name', confidence: 'medium' },

  // ====== ID variables ======
  { pattern: /\btask_id\b/g, replacement: '{{id_var}}', slot: 'id_var', confidence: 'high' },
  { pattern: /\bitem_id\b/g, replacement: '{{id_var}}', slot: 'id_var', confidence: 'high' },
  { pattern: /\bproduct_id\b/g, replacement: '{{id_var}}', slot: 'id_var', confidence: 'high' },

  // ====== Action verbs ======
  { pattern: /\bcomplete\(/g, replacement: '{{action_verb}}(', slot: 'action_verb', confidence: 'low' },
  { pattern: /\bequip\(/g, replacement: '{{action_verb}}(', slot: 'action_verb', confidence: 'low' },
  { pattern: /\badd_to_cart\(/g, replacement: '{{action_verb}}(', slot: 'action_verb', confidence: 'low' },
];

function analyzeSuggestions(
  text: string,
  context: Suggestion['context']
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const seenPatterns = new Set<string>();

  for (const { pattern, replacement, slot, confidence } of REPLACEMENTS) {
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
    const matches = text.match(pattern);

    if (matches) {
      for (const match of matches) {
        const key = `${match}->${replacement}`;
        if (!seenPatterns.has(key)) {
          seenPatterns.add(key);
          suggestions.push({
            original: match,
            suggested: replacement,
            slot,
            context,
            confidence,
          });
        }
      }
    }
  }

  return suggestions;
}

function loadExercises(): Map<string, { exercise: Exercise; file: string }> {
  const exercises = new Map<string, { exercise: Exercise; file: string }>();
  const files = readdirSync(EXERCISES_DIR).filter(f => f.endsWith('.yaml'));

  for (const file of files) {
    const content = readFileSync(join(EXERCISES_DIR, file), 'utf-8');
    const data = parse(content) as YamlFile;

    if (data?.exercises && Array.isArray(data.exercises)) {
      for (const ex of data.exercises) {
        if (ex.slug) {
          exercises.set(ex.slug, { exercise: ex, file });
        }
      }
    }
  }

  return exercises;
}

function loadAvailableSlots(): string[] {
  const slots = new Set<string>();
  const files = readdirSync(SKINS_DIR).filter(f => f.endsWith('.yaml'));

  for (const file of files) {
    const content = readFileSync(join(SKINS_DIR, file), 'utf-8');
    const data = parse(content) as { vars?: Record<string, unknown> };

    if (data?.vars) {
      for (const key of Object.keys(data.vars)) {
        slots.add(key);
      }
    }
  }

  return [...slots].sort();
}

function analyzeExercise(
  slug: string,
  exercise: Exercise,
  file: string
): { suggestions: Suggestion[]; slotsUsed: Set<string> } {
  const allSuggestions: Suggestion[] = [];
  const slotsUsed = new Set<string>();

  // Analyze prompt
  if (exercise.prompt) {
    const sugs = analyzeSuggestions(exercise.prompt, 'prompt');
    allSuggestions.push(...sugs);
    sugs.forEach(s => slotsUsed.add(s.slot));
  }

  // Analyze template (fill-in exercises)
  if (exercise.template) {
    const sugs = analyzeSuggestions(exercise.template, 'template');
    allSuggestions.push(...sugs);
    sugs.forEach(s => slotsUsed.add(s.slot));
  }

  // Analyze expected_answer
  if (exercise.expected_answer) {
    const sugs = analyzeSuggestions(exercise.expected_answer, 'answer');
    allSuggestions.push(...sugs);
    sugs.forEach(s => slotsUsed.add(s.slot));
  }

  // Analyze accepted_solutions
  if (exercise.accepted_solutions) {
    for (const sol of exercise.accepted_solutions) {
      const sugs = analyzeSuggestions(sol, 'answer');
      allSuggestions.push(...sugs);
      sugs.forEach(s => slotsUsed.add(s.slot));
    }
  }

  // Analyze code (predict exercises)
  if (exercise.code) {
    const sugs = analyzeSuggestions(exercise.code, 'code');
    allSuggestions.push(...sugs);
    sugs.forEach(s => slotsUsed.add(s.slot));
  }

  // Analyze hints
  if (exercise.hints) {
    for (const hint of exercise.hints) {
      const sugs = analyzeSuggestions(hint, 'hints');
      allSuggestions.push(...sugs);
      sugs.forEach(s => slotsUsed.add(s.slot));
    }
  }

  return { suggestions: allSuggestions, slotsUsed };
}

function formatConfidence(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return '[HIGH]  ';
    case 'medium':
      return '[MEDIUM]';
    case 'low':
      return '[LOW]   ';
  }
}

function printAnalysis(
  slug: string,
  exercise: Exercise,
  file: string,
  suggestions: Suggestion[],
  slotsUsed: Set<string>
): void {
  console.log('='.repeat(70));
  console.log(`Exercise: ${slug}`);
  console.log(`File: ${file}`);
  console.log(`Title: ${exercise.title}`);
  console.log('-'.repeat(70));

  console.log('\nCurrent content:');
  console.log(`  prompt: ${exercise.prompt}`);
  if (exercise.template) {
    console.log(`  template: ${exercise.template}`);
  }
  console.log(`  expected_answer: ${exercise.expected_answer}`);
  if (exercise.code) {
    console.log(`  code: ${exercise.code.substring(0, 100)}${exercise.code.length > 100 ? '...' : ''}`);
  }

  console.log('\n' + '-'.repeat(70));

  if (suggestions.length === 0) {
    console.log('\nNo template slot replacements found.');
    console.log('This exercise may already use templates, or uses concepts-only values.');
  } else {
    console.log('\nSuggested replacements:');
    console.log('(Review each carefully - not all replacements are appropriate)\n');

    // Group by context
    const byContext = new Map<string, Suggestion[]>();
    for (const s of suggestions) {
      const list = byContext.get(s.context) || [];
      list.push(s);
      byContext.set(s.context, list);
    }

    for (const [context, contextSuggestions] of byContext) {
      console.log(`  In ${context}:`);
      for (const s of contextSuggestions) {
        console.log(
          `    ${formatConfidence(s.confidence)} ${s.original} -> ${s.suggested}`
        );
        console.log(`                   (uses slot: ${s.slot})`);
      }
      console.log();
    }

    console.log('-'.repeat(70));
    console.log('Slots that would be used:', [...slotsUsed].join(', '));
  }

  console.log('='.repeat(70));
  console.log();
}

function scanAllExercises(exercises: Map<string, { exercise: Exercise; file: string }>): void {
  console.log('Scanning all exercises for migration candidates...\n');

  const candidatesBySlotCount: Map<number, string[]> = new Map();
  let totalCandidates = 0;

  for (const [slug, { exercise, file }] of exercises) {
    const { suggestions, slotsUsed } = analyzeExercise(slug, exercise, file);

    if (suggestions.length > 0) {
      totalCandidates++;
      const count = slotsUsed.size;
      const list = candidatesBySlotCount.get(count) || [];
      list.push(`${slug} (${[...slotsUsed].join(', ')})`);
      candidatesBySlotCount.set(count, list);
    }
  }

  console.log(`Found ${totalCandidates} exercises with potential slot replacements:\n`);

  // Sort by slot count (higher = more impactful migration)
  const sortedCounts = [...candidatesBySlotCount.keys()].sort((a, b) => b - a);

  for (const count of sortedCounts) {
    const list = candidatesBySlotCount.get(count)!;
    console.log(`=== ${count} slot(s) ===`);
    for (const entry of list.slice(0, 10)) {
      console.log(`  - ${entry}`);
    }
    if (list.length > 10) {
      console.log(`  ... and ${list.length - 10} more`);
    }
    console.log();
  }

  console.log('-'.repeat(70));
  console.log('To analyze a specific exercise, run:');
  console.log('  npx tsx scripts/migrate-exercise-to-template.ts <exercise-slug>');
}

async function main(): Promise<void> {
  const targetSlug = process.argv[2];

  if (!targetSlug) {
    console.log('Usage:');
    console.log('  npx tsx scripts/migrate-exercise-to-template.ts <exercise-slug>');
    console.log('  npx tsx scripts/migrate-exercise-to-template.ts --all');
    console.log();
    console.log('Examples:');
    console.log('  npx tsx scripts/migrate-exercise-to-template.ts list-create-empty');
    console.log('  npx tsx scripts/migrate-exercise-to-template.ts dict-create-values');
    console.log('  npx tsx scripts/migrate-exercise-to-template.ts --all  # Scan all exercises');
    process.exit(1);
  }

  const exercises = loadExercises();
  console.log(`Loaded ${exercises.size} exercises from ${EXERCISES_DIR}\n`);

  // Handle --all flag
  if (targetSlug === '--all') {
    scanAllExercises(exercises);
    return;
  }

  // Single exercise analysis
  const entry = exercises.get(targetSlug);

  if (!entry) {
    console.error(`Exercise not found: ${targetSlug}`);
    console.log('\nAvailable slugs containing your search term:');
    const matches = [...exercises.keys()]
      .filter(s => s.includes(targetSlug))
      .slice(0, 10);
    if (matches.length > 0) {
      matches.forEach(s => console.log(`  - ${s}`));
    } else {
      console.log('  (no matches)');
    }
    process.exit(1);
  }

  const { exercise, file } = entry;
  const { suggestions, slotsUsed } = analyzeExercise(targetSlug, exercise, file);

  printAnalysis(targetSlug, exercise, file, suggestions, slotsUsed);

  // Print available slots for reference
  console.log('Available skin slots in current skins:');
  const slots = loadAvailableSlots();
  console.log(`  ${slots.join(', ')}`);
  console.log();

  console.log('NOTE: This tool provides suggestions only.');
  console.log('Review each replacement carefully before editing the YAML file.');
  console.log('Some values (like generic "data" or teaching examples) should NOT be replaced.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
