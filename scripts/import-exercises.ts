// scripts/import-exercises.ts
// Load environment variables FIRST - before any other imports that might use process.env
import { config } from 'dotenv';
config({ path: '.env.test.local' });
config({ path: '.env.local' }); // fallback

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, basename } from 'path';
import { parse as parseYaml } from 'yaml';
import { createClient } from '@supabase/supabase-js';
import type { YamlExerciseFile, YamlValidationError } from '../src/lib/exercise/yaml-types';
import { validateYamlFile } from '../src/lib/exercise/yaml-validation';

// Configuration
const EXERCISES_DIR = join(process.cwd(), 'exercises');
const isProd = process.argv.includes('--prod');

// Supabase client setup
const supabaseUrl = isProd
  ? process.env.SUPABASE_URL!
  : process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = isProd
  ? process.env.SUPABASE_SERVICE_ROLE_KEY!
  : process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

if (isProd && (!supabaseUrl || !supabaseKey)) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for --prod');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: {
    headers: {
      // Force schema cache reload
      'x-client-info': 'import-script',
    },
  },
  db: {
    schema: 'public',
  },
});

interface ImportStats {
  inserted: number;
  updated: number;
  errors: number;
}

/**
 * Find all YAML files in exercises directory
 */
function findYamlFiles(baseDir: string): string[] {
  const files: string[] = [];

  if (!existsSync(baseDir)) {
    return files;
  }

  for (const language of readdirSync(baseDir)) {
    const langDir = join(baseDir, language);
    if (!existsSync(langDir)) continue;
    // Skip non-directories (like schema.json)
    if (!statSync(langDir).isDirectory()) continue;

    for (const file of readdirSync(langDir)) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        files.push(join(langDir, file));
      }
    }
  }

  return files;
}

/**
 * Parse and validate all YAML files
 */
function loadAndValidateFiles(files: string[]): {
  valid: boolean;
  errors: YamlValidationError[];
  fileData: Array<{ path: string; content: YamlExerciseFile }>;
  totalExercises: number;
} {
  const allErrors: YamlValidationError[] = [];
  const fileData: Array<{ path: string; content: YamlExerciseFile }> = [];
  let totalExercises = 0;

  for (const filePath of files) {
    const fileName = basename(filePath);
    console.log(`  Parsing ${filePath}...`);

    try {
      const content = readFileSync(filePath, 'utf-8');
      const parsed = parseYaml(content) as YamlExerciseFile;
      const result = validateYamlFile(parsed, fileName);

      if (!result.valid) {
        allErrors.push(...result.errors);
      } else {
        fileData.push({ path: filePath, content: parsed });
        totalExercises += result.exerciseCount;
        console.log(`    ✓ ${result.exerciseCount} exercises`);
      }
    } catch (err) {
      allErrors.push({
        file: fileName,
        field: 'parse',
        message: `Failed to parse YAML: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }
  }

  // Check for duplicate slugs across all files within same language
  const slugsByLanguage = new Map<string, Set<string>>();
  for (const { content, path } of fileData) {
    const lang = content.language;
    if (!slugsByLanguage.has(lang)) {
      slugsByLanguage.set(lang, new Set());
    }
    const slugs = slugsByLanguage.get(lang)!;

    for (const exercise of content.exercises) {
      if (slugs.has(exercise.slug)) {
        allErrors.push({
          file: basename(path),
          slug: exercise.slug,
          field: 'slug',
          message: `duplicate slug "${exercise.slug}" across files for language "${lang}"`,
        });
      }
      slugs.add(exercise.slug);
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    fileData,
    totalExercises,
  };
}

/**
 * Import exercises to database
 */
async function importToDatabase(
  fileData: Array<{ path: string; content: YamlExerciseFile }>
): Promise<ImportStats> {
  const stats: ImportStats = { inserted: 0, updated: 0, errors: 0 };

  for (const { content } of fileData) {
    for (const exercise of content.exercises) {
      const row = {
        language: content.language,
        category: content.category,
        slug: exercise.slug,
        title: exercise.title,
        difficulty: exercise.difficulty,
        prompt: exercise.prompt,
        expected_answer: exercise.expected_answer,
        hints: exercise.hints,
        tags: exercise.tags || [],
        explanation: null, // Omitted for MVP
        accepted_solutions: exercise.accepted_solutions || [],
        // New taxonomy fields
        concept: exercise.concept,
        subconcept: exercise.subconcept,
        level: exercise.level,
        prereqs: exercise.prereqs ?? [],
        exercise_type: exercise.type ?? 'write',
        pattern: exercise.pattern,
        template: exercise.template ?? null,
        blank_position: exercise.blank_position ?? null,
        objective: exercise.objective,
        targets: exercise.targets ?? null,
        code: exercise.code ?? null,
      };

      // Upsert on (language, slug) - check if exists first
      const { data: existing } = await supabase
        .from('exercises')
        .select('id')
        .eq('language', row.language)
        .eq('slug', row.slug)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('exercises')
          .update(row)
          .eq('id', existing.id);

        if (error) {
          console.error(`  ✗ Error updating ${exercise.slug}: ${error.message}`);
          stats.errors++;
        } else {
          stats.updated++;
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from('exercises')
          .insert(row);

        if (error) {
          console.error(`  ✗ Error inserting ${exercise.slug}: ${error.message}`);
          stats.errors++;
        } else {
          stats.inserted++;
        }
      }
    }
  }

  return stats;
}

/**
 * Main entry point
 */
async function main() {
  console.log(`\n🔍 Scanning ${EXERCISES_DIR}...\n`);

  const files = findYamlFiles(EXERCISES_DIR);
  if (files.length === 0) {
    console.log('No YAML files found in exercises directory.');
    console.log('Expected structure: exercises/{language}/*.yaml');
    process.exit(0);
  }

  console.log(`Found ${files.length} YAML file(s)\n`);
  console.log('📖 Parsing and validating...\n');

  const { valid, errors, fileData, totalExercises } = loadAndValidateFiles(files);

  if (!valid) {
    console.log('\n❌ Validation failed:\n');
    for (const error of errors) {
      console.log(`  ${error.file}${error.slug ? ` [${error.slug}]` : ''}: ${error.field} - ${error.message}`);
    }
    process.exit(1);
  }

  console.log(`\n✅ Validation passed: ${totalExercises} exercises in ${fileData.length} files\n`);
  console.log(`📤 Importing to database (${isProd ? 'PRODUCTION' : 'local'})...\n`);

  const stats = await importToDatabase(fileData);

  console.log('\n📊 Import complete:\n');
  console.log(`  Inserted: ${stats.inserted}`);
  console.log(`  Updated:  ${stats.updated}`);
  console.log(`  Errors:   ${stats.errors}`);
  console.log(`\n✨ Done! ${stats.inserted + stats.updated} exercises in database.\n`);

  if (stats.errors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
