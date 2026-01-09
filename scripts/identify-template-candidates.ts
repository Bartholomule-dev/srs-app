// scripts/identify-template-candidates.ts
// Identifies exercises that could benefit from skin-driven templating

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface Exercise {
  slug: string;
  prompt?: string;
  template?: string;
  expected_answer?: string;
  accepted_solutions?: string[];
  hints?: string[];
}

interface ExerciseFile {
  exercises: Exercise[];
}

// Patterns to detect hardcoded values that could become skin-driven slots
// Based on SkinVars interface: list_name, item_singular, item_plural, item_examples, etc.
const VARIABLE_PATTERNS = [
  // list_name candidates - generic collection variable names
  {
    pattern: /\b(items|lst|my_list|numbers|data|elements|values|results|arr|collection)\b/gi,
    slot: 'list_name',
    description: 'Generic list variable names',
  },
  // item_singular candidates - generic item variable names in loops
  {
    pattern: /\b(item|element|num|value|x|el|entry|n|thing)\b(?=\s+in\b)/gi,
    slot: 'item_singular',
    description: 'Generic loop variable names',
  },
  // item_examples candidates - hardcoded string literals
  {
    pattern: /"(apple|banana|cherry|orange|grape|Alice|Bob|Charlie|task|todo|item\d*|hello|world|test|foo|bar|baz)"/gi,
    slot: 'item_examples',
    description: 'Hardcoded example strings',
  },
  // Also catch single-quoted strings
  {
    pattern: /'(apple|banana|cherry|orange|grape|Alice|Bob|Charlie|task|todo|item\d*|hello|world|test|foo|bar|baz)'/gi,
    slot: 'item_examples',
    description: 'Hardcoded example strings (single quotes)',
  },
  // filename candidates
  {
    pattern: /"(data|output|input|file|results|config|settings|log)\.(txt|json|csv|yaml|log)"/gi,
    slot: 'filename',
    description: 'Hardcoded filenames',
  },
  // record_keys candidates - generic dict keys
  {
    pattern: /\["?(name|age|id|status|value|key|count|price|title|description)"?\]/gi,
    slot: 'record_keys',
    description: 'Generic dictionary keys',
  },
  // entity_name candidates - class names that could be skinned
  {
    pattern: /\bclass\s+(Item|Person|User|Entity|Object|Thing|Data|Record)\b/gi,
    slot: 'entity_name',
    description: 'Generic class names',
  },
  // id_var candidates
  {
    pattern: /\b(item_id|user_id|id|idx|index)\b/gi,
    slot: 'id_var',
    description: 'Generic ID variables',
  },
  // status_var candidates
  {
    pattern: /\b(is_active|is_done|completed|status|state|active|done)\b/gi,
    slot: 'status_var',
    description: 'Generic status variables',
  },
];

// Patterns that indicate already templated content (should be skipped)
const TEMPLATE_INDICATORS = [/\{\{[^}]+\}\}/, /generator:/];

function extractAllText(exercise: Exercise): string {
  const parts: string[] = [];

  if (exercise.prompt) parts.push(exercise.prompt);
  if (exercise.template) parts.push(exercise.template);
  if (exercise.expected_answer) parts.push(exercise.expected_answer);
  if (exercise.accepted_solutions) {
    parts.push(...exercise.accepted_solutions);
  }
  if (exercise.hints) {
    parts.push(...exercise.hints);
  }

  return parts.join('\n');
}

interface Match {
  slot: string;
  values: string[];
  description: string;
}

interface Candidate {
  file: string;
  slug: string;
  matches: Match[];
  matchCount: number;
  hasGenerator: boolean;
  isTemplated: boolean;
}

async function main() {
  const exerciseDir = path.join(process.cwd(), 'exercises', 'python');
  const files = fs.readdirSync(exerciseDir).filter((f) => f.endsWith('.yaml'));

  const candidates: Candidate[] = [];
  let totalExercises = 0;
  let skippedTemplated = 0;
  let skippedGenerator = 0;

  for (const file of files) {
    const filePath = path.join(exerciseDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = yaml.load(content) as ExerciseFile;

    if (!data.exercises) continue;

    for (const exercise of data.exercises) {
      totalExercises++;

      // Find this exercise in the raw YAML to check for generator
      const exerciseYaml = getExerciseYamlBlock(content, exercise.slug);
      const hasGenerator = exerciseYaml.includes('generator:');
      const isTemplated = TEMPLATE_INDICATORS.some((p) => p.test(exerciseYaml));

      if (hasGenerator) {
        skippedGenerator++;
        continue;
      }

      if (isTemplated) {
        skippedTemplated++;
        continue;
      }

      const allText = extractAllText(exercise);
      const matches: Match[] = [];

      for (const { pattern, slot, description } of VARIABLE_PATTERNS) {
        // Reset regex state
        pattern.lastIndex = 0;
        const found: string[] = [];
        let match;

        while ((match = pattern.exec(allText)) !== null) {
          // Extract the captured group or the whole match
          const value = match[1] || match[0];
          if (!found.includes(value.toLowerCase())) {
            found.push(value.toLowerCase());
          }
        }

        if (found.length > 0) {
          matches.push({ slot, values: found, description });
        }
      }

      if (matches.length > 0) {
        candidates.push({
          file,
          slug: exercise.slug,
          matches,
          matchCount: matches.reduce((sum, m) => sum + m.values.length, 0),
          hasGenerator,
          isTemplated,
        });
      }
    }
  }

  // Sort by match count (most impactful first)
  candidates.sort((a, b) => b.matchCount - a.matchCount);

  // Print summary
  console.log('='.repeat(70));
  console.log('TEMPLATE CONVERSION CANDIDATE ANALYSIS');
  console.log('='.repeat(70));
  console.log();
  console.log('Summary:');
  console.log(`  Total exercises scanned: ${totalExercises}`);
  console.log(`  Skipped (already has generator): ${skippedGenerator}`);
  console.log(`  Skipped (already templated): ${skippedTemplated}`);
  console.log(`  Candidates found: ${candidates.length}`);
  console.log();

  // Group by file for organized output
  const byFile = new Map<string, Candidate[]>();
  for (const c of candidates) {
    if (!byFile.has(c.file)) byFile.set(c.file, []);
    byFile.get(c.file)!.push(c);
  }

  // Sort files by number of candidates
  const sortedFiles = [...byFile.entries()].sort(
    (a, b) => b[1].length - a[1].length
  );

  console.log('-'.repeat(70));
  console.log('CANDIDATES BY FILE (sorted by count)');
  console.log('-'.repeat(70));
  console.log();

  for (const [file, items] of sortedFiles) {
    console.log(`${file}: ${items.length} candidates`);
  }

  console.log();
  console.log('-'.repeat(70));
  console.log('SLOT DISTRIBUTION');
  console.log('-'.repeat(70));
  console.log();

  // Count occurrences by slot
  const slotCounts = new Map<string, number>();
  for (const c of candidates) {
    for (const m of c.matches) {
      slotCounts.set(m.slot, (slotCounts.get(m.slot) || 0) + 1);
    }
  }

  const sortedSlots = [...slotCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [slot, count] of sortedSlots) {
    console.log(`  ${slot}: ${count} exercises`);
  }

  console.log();
  console.log('-'.repeat(70));
  console.log('TOP 30 HIGH-IMPACT CANDIDATES');
  console.log('-'.repeat(70));
  console.log();

  for (const item of candidates.slice(0, 30)) {
    console.log(`[${item.file}] ${item.slug} (${item.matchCount} matches):`);
    for (const m of item.matches) {
      console.log(`    ${m.slot}: ${m.values.join(', ')}`);
    }
    console.log();
  }

  console.log('-'.repeat(70));
  console.log('DETAILED FILE BREAKDOWN');
  console.log('-'.repeat(70));

  for (const [file, items] of sortedFiles) {
    console.log();
    console.log(`${'='.repeat(50)}`);
    console.log(`${file.toUpperCase()} (${items.length} candidates)`);
    console.log(`${'='.repeat(50)}`);

    // Sort items within file by match count
    items.sort((a, b) => b.matchCount - a.matchCount);

    for (const item of items.slice(0, 15)) {
      // Show top 15 per file
      console.log(`  ${item.slug}:`);
      for (const m of item.matches) {
        console.log(`      ${m.slot}: ${m.values.join(', ')}`);
      }
    }

    if (items.length > 15) {
      console.log(`  ... and ${items.length - 15} more candidates`);
    }
  }

  // Print actionable recommendations
  console.log();
  console.log('='.repeat(70));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(70));
  console.log();
  console.log('1. Highest impact files (most candidates):');
  for (const [file, items] of sortedFiles.slice(0, 5)) {
    console.log(`   - ${file}: ${items.length} exercises to convert`);
  }
  console.log();
  console.log('2. Most common slots to template:');
  for (const [slot, count] of sortedSlots.slice(0, 5)) {
    console.log(`   - ${slot}: appears in ${count} exercises`);
  }
  console.log();
  console.log(
    '3. Quick wins (exercises with 3+ templateable patterns to maximize value):'
  );
  const quickWins = candidates.filter((c) => c.matches.length >= 3);
  console.log(`   ${quickWins.length} exercises have 3+ templateable slots`);
  if (quickWins.length > 0) {
    console.log('   Top 5:');
    for (const c of quickWins.slice(0, 5)) {
      console.log(`     - ${c.slug}: ${c.matches.map((m) => m.slot).join(', ')}`);
    }
  }
}

/**
 * Extract the YAML block for a specific exercise slug
 */
function getExerciseYamlBlock(content: string, slug: string): string {
  // Find the line with this slug
  const slugPattern = new RegExp(`slug:\\s*${slug}(?:\\s|$)`, 'm');
  const match = content.match(slugPattern);

  if (!match || match.index === undefined) {
    return '';
  }

  // Find the start of this exercise block (look backwards for "- slug:")
  let startIndex = match.index;
  while (startIndex > 0 && content.substring(startIndex - 8, startIndex) !== '  - slug') {
    startIndex--;
  }
  startIndex = Math.max(0, startIndex - 8);

  // Find the end (next exercise block or end of file)
  const nextExercise = content.indexOf('\n  - slug:', match.index + 1);
  const endIndex = nextExercise === -1 ? content.length : nextExercise;

  return content.substring(startIndex, endIndex);
}

main().catch(console.error);
