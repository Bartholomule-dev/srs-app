// scripts/blueprint-coverage.ts
// Reports which exercises are covered by blueprints and which remain orphaned

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import yaml from 'js-yaml';
import { loadBlueprints } from '../src/lib/paths/loader';

const EXERCISES_DIR = join(process.cwd(), 'exercises', 'python');

interface ExerciseEntry {
  slug: string;
  concept?: string;
  subconcept?: string;
  [key: string]: unknown;
}

interface ExerciseFile {
  exercises: ExerciseEntry[];
}

interface BlueprintStats {
  id: string;
  title: string;
  beatCount: number;
  concepts: string[];
}

interface ConceptCoverage {
  total: number;
  covered: number;
  exercises: string[];
  coveredExercises: string[];
}

/**
 * Load all exercises from YAML files
 */
async function loadExercises(): Promise<ExerciseEntry[]> {
  const exercises: ExerciseEntry[] = [];

  try {
    const files = await readdir(EXERCISES_DIR);
    const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

    for (const file of yamlFiles) {
      const content = await readFile(join(EXERCISES_DIR, file), 'utf-8');
      const data = yaml.load(content) as ExerciseFile;

      if (data?.exercises && Array.isArray(data.exercises)) {
        exercises.push(...data.exercises);
      }
    }
  } catch (err) {
    console.error('Failed to load exercises:', (err as Error).message);
    process.exit(1);
  }

  return exercises;
}

async function main() {
  console.log('Blueprint Coverage Report');
  console.log('='.repeat(60));
  console.log();

  // Load all exercises
  const exercises = await loadExercises();
  const allExercises = new Map<string, ExerciseEntry>();
  for (const ex of exercises) {
    if (ex.slug) {
      allExercises.set(ex.slug, ex);
    }
  }

  // Load all blueprints
  const blueprints = await loadBlueprints();

  // Build coverage data
  const coveredExercises = new Set<string>();
  const blueprintStats: BlueprintStats[] = [];

  for (const bp of blueprints) {
    for (const beat of bp.beats) {
      coveredExercises.add(beat.exercise);
    }

    blueprintStats.push({
      id: bp.id,
      title: bp.title,
      beatCount: bp.beats.length,
      concepts: bp.concepts,
    });
  }

  // Calculate orphaned exercises
  const orphaned = [...allExercises.keys()].filter(slug => !coveredExercises.has(slug));

  // Build concept-level coverage
  const conceptCoverage = new Map<string, ConceptCoverage>();
  for (const [slug, ex] of allExercises) {
    const concept = ex.concept || 'unknown';
    if (!conceptCoverage.has(concept)) {
      conceptCoverage.set(concept, { total: 0, covered: 0, exercises: [], coveredExercises: [] });
    }
    const coverage = conceptCoverage.get(concept)!;
    coverage.total++;
    coverage.exercises.push(slug);
    if (coveredExercises.has(slug)) {
      coverage.covered++;
      coverage.coveredExercises.push(slug);
    }
  }

  // Report: Blueprint Summary
  console.log('BLUEPRINTS');
  console.log('-'.repeat(60));
  for (const stat of blueprintStats) {
    console.log(`  ${stat.id}`);
    console.log(`    Title: ${stat.title}`);
    console.log(`    Beats: ${stat.beatCount}`);
    console.log(`    Concepts: ${stat.concepts.join(', ')}`);
    console.log();
  }

  // Report: Overall Stats
  console.log('OVERALL COVERAGE');
  console.log('-'.repeat(60));
  const coveragePercent = ((coveredExercises.size / allExercises.size) * 100).toFixed(1);
  console.log(`  Total exercises:         ${allExercises.size}`);
  console.log(`  Covered by blueprints:   ${coveredExercises.size} (${coveragePercent}%)`);
  console.log(`  Orphaned (no blueprint): ${orphaned.length}`);
  console.log();

  // Report: Coverage by Concept
  console.log('COVERAGE BY CONCEPT');
  console.log('-'.repeat(60));
  const sortedConcepts = [...conceptCoverage.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [concept, coverage] of sortedConcepts) {
    const percent = coverage.total > 0 ? ((coverage.covered / coverage.total) * 100).toFixed(0) : '0';
    const bar = '|'.repeat(Math.round(coverage.covered / coverage.total * 20) || 0).padEnd(20, ' ');
    console.log(`  ${concept.padEnd(25)} ${coverage.covered.toString().padStart(3)}/${coverage.total.toString().padEnd(3)} [${bar}] ${percent}%`);
  }
  console.log();

  // Report: Orphaned Exercises (grouped by concept)
  if (orphaned.length > 0) {
    console.log('ORPHANED EXERCISES');
    console.log('-'.repeat(60));
    console.log('(Exercises not included in any blueprint)');
    console.log();

    // Group orphaned by concept
    const orphanedByConcept = new Map<string, string[]>();
    for (const slug of orphaned) {
      const ex = allExercises.get(slug);
      const concept = ex?.concept || 'unknown';
      if (!orphanedByConcept.has(concept)) {
        orphanedByConcept.set(concept, []);
      }
      orphanedByConcept.get(concept)!.push(slug);
    }

    const sortedOrphaned = [...orphanedByConcept.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [concept, slugs] of sortedOrphaned) {
      console.log(`  ${concept} (${slugs.length}):`);
      for (const slug of slugs.sort()) {
        console.log(`    - ${slug}`);
      }
    }
  }

  console.log();
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
