// scripts/audit-grading.ts
// Analyzes exercises and recommends grading strategies

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'yaml';

const EXERCISES_DIR = 'exercises/python';

interface YamlExerciseFile {
  language: string;
  category: string;
  exercises: YamlExercise[];
}

interface YamlExercise {
  slug: string;
  type: string;
  expected_answer: string;
  grading_strategy?: string;
  accepted_solutions?: string[];
  [key: string]: unknown;
}

interface AuditResult {
  slug: string;
  file: string;
  currentStrategy: string | null;
  recommendedStrategy: string;
  reason: string;
  hasAcceptedSolutions: boolean;
  acceptedSolutionsCount: number;
}

const SLICE_PATTERN = /\[.*:.*\]/;
const COMPREHENSION_PATTERN = /\[.*for.*in.*\]/;
const DICT_COMP_PATTERN = /\{.*for.*in.*\}/;

function auditExercises() {
  const files = readdirSync(EXERCISES_DIR).filter(f => f.endsWith('.yaml'));
  const results: AuditResult[] = [];

  for (const filename of files) {
    const filePath = join(EXERCISES_DIR, filename);
    const content = readFileSync(filePath, 'utf-8');
    const parsed = yaml.parse(content) as YamlExerciseFile;

    for (const ex of parsed.exercises) {
      const result = analyzeExercise(ex, filePath);
      results.push(result);
    }
  }

  // Generate report
  console.log('\n=== Grading Strategy Audit ===\n');

  // Summary stats
  const total = results.length;
  const withStrategy = results.filter(r => r.currentStrategy !== null).length;
  const needsToken = results.filter(r => r.recommendedStrategy === 'token' && !r.currentStrategy).length;
  const needsExecution = results.filter(r => r.recommendedStrategy === 'execution' && !r.currentStrategy).length;

  console.log(`Total exercises: ${total}`);
  console.log(`With explicit strategy: ${withStrategy}`);
  console.log(`Recommended for token strategy: ${needsToken}`);
  console.log(`Recommended for execution strategy: ${needsExecution}`);

  // Exercises needing token strategy
  console.log('\n--- Exercises needing token strategy ---');
  const tokenCandidates = results.filter(r => r.recommendedStrategy === 'token' && !r.currentStrategy);
  for (const r of tokenCandidates.slice(0, 15)) {
    console.log(`  ${r.slug}: ${r.reason}`);
  }
  if (tokenCandidates.length > 15) {
    console.log(`  ... and ${tokenCandidates.length - 15} more`);
  }

  // Exercises with many alternatives
  const manyAlternatives = results.filter(r => r.acceptedSolutionsCount > 5);
  console.log(`\n--- Exercises with 5+ alternatives (consider token/ast): ${manyAlternatives.length} ---`);
  for (const r of manyAlternatives.slice(0, 10)) {
    console.log(`  ${r.slug}: ${r.acceptedSolutionsCount} alternatives`);
  }
  if (manyAlternatives.length > 10) {
    console.log(`  ... and ${manyAlternatives.length - 10} more`);
  }

  // Predict exercises without execution
  const predictNeedsExecution = results.filter(
    r => r.recommendedStrategy === 'execution' && !r.currentStrategy
  );
  console.log(`\n--- Predict exercises using default execution: ${predictNeedsExecution.length} ---`);

  console.log('\n=== Audit Complete ===\n');
}

function analyzeExercise(ex: YamlExercise, file: string): AuditResult {
  const acceptedCount = ex.accepted_solutions?.length ?? 0;
  const answer = ex.expected_answer ?? '';

  let recommended = 'exact';
  let reason = 'Default for type';

  if (ex.type === 'predict') {
    recommended = 'execution';
    reason = 'Predict exercises should use execution';
  } else if (acceptedCount > 5) {
    recommended = 'token';
    reason = `High alternative count (${acceptedCount}) suggests semantic matching needed`;
  } else if (SLICE_PATTERN.test(answer)) {
    recommended = 'token';
    reason = 'Contains slice notation - semantic variations likely';
  } else if (COMPREHENSION_PATTERN.test(answer) || DICT_COMP_PATTERN.test(answer)) {
    recommended = 'token';
    reason = 'Contains comprehension - whitespace variations likely';
  }

  return {
    slug: ex.slug,
    file,
    currentStrategy: ex.grading_strategy ?? null,
    recommendedStrategy: recommended,
    reason,
    hasAcceptedSolutions: acceptedCount > 0,
    acceptedSolutionsCount: acceptedCount,
  };
}

auditExercises();
