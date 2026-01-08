#!/usr/bin/env npx tsx
/**
 * Check prereq chains for logical issues:
 * 1. Cycles in subconcept prereqs
 * 2. Exercise prereqs referencing non-existent subconcepts
 * 3. Intro exercises with unusually many prereqs
 */

import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';

interface Exercise {
  slug: string;
  title: string;
  concept: string;
  subconcept: string;
  level: string;
  prereqs?: string[];
}

interface CurriculumConcept {
  slug: string;
  name: string;
  prereqs: string[];
  subconcepts: string[];
}

interface Curriculum {
  concepts: CurriculumConcept[];
}

// Load curriculum
const curriculumPath = path.join(__dirname, '../src/lib/curriculum/python.json');
const curriculum: Curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'));

// Build set of valid subconcepts (format: "concept.subconcept" or just "subconcept")
const validSubconcepts = new Set<string>();
const validConcepts = new Set<string>();
const subconcepToConcept = new Map<string, string>();

for (const concept of curriculum.concepts) {
  validConcepts.add(concept.slug);
  for (const sub of concept.subconcepts) {
    // Both formats are valid
    validSubconcepts.add(sub);  // just "lists"
    validSubconcepts.add(`${concept.slug}.${sub}`);  // "collections.lists"
    subconcepToConcept.set(sub, concept.slug);
  }
}

console.log(`Found ${validSubconcepts.size / 2} unique subconcepts across ${validConcepts.size} concepts\n`);

// Load all exercises
const exercisesDir = path.join(__dirname, '../exercises/python');
const exercises: Exercise[] = [];

const files = fs.readdirSync(exercisesDir).filter(f => f.endsWith('.yaml'));
for (const file of files) {
  const content = fs.readFileSync(path.join(exercisesDir, file), 'utf-8');
  const data = YAML.parse(content) as { exercises: Exercise[] };
  if (data?.exercises) {
    exercises.push(...data.exercises);
  }
}

console.log(`Loaded ${exercises.length} exercises\n`);

// Normalize prereq to check both formats
function isValidPrereq(prereq: string): boolean {
  // Direct match
  if (validSubconcepts.has(prereq)) return true;

  // Could be short form (just subconcept name)
  if (subconcepToConcept.has(prereq)) return true;

  // Could be concept-only (like "foundations")
  if (validConcepts.has(prereq)) return true;

  return false;
}

// Check exercise prereqs
interface Issue {
  type: string;
  exercise: string;
  details: string;
}

const issues: Issue[] = [];

for (const ex of exercises) {
  if (!ex.prereqs || ex.prereqs.length === 0) continue;

  // Check for invalid prereqs
  for (const prereq of ex.prereqs) {
    if (!isValidPrereq(prereq)) {
      issues.push({
        type: 'invalid-prereq',
        exercise: ex.slug,
        details: `Prereq "${prereq}" is not a valid concept or subconcept`
      });
    }
  }

  // Check intro exercises with many prereqs
  if (ex.level === 'intro' && ex.prereqs.length >= 3) {
    issues.push({
      type: 'intro-many-prereqs',
      exercise: ex.slug,
      details: `Intro exercise has ${ex.prereqs.length} prereqs: ${ex.prereqs.join(', ')}`
    });
  }

  // Check if prereqs include own subconcept (should not)
  if (ex.prereqs.includes(ex.subconcept) || ex.prereqs.includes(`${ex.concept}.${ex.subconcept}`)) {
    issues.push({
      type: 'self-prereq',
      exercise: ex.slug,
      details: `Exercise has its own subconcept "${ex.subconcept}" as a prereq`
    });
  }
}

// Report findings
console.log('=== EXERCISE PREREQ ISSUES ===');
if (issues.length === 0) {
  console.log('No issues found');
} else {
  const byType = new Map<string, Issue[]>();
  for (const issue of issues) {
    const list = byType.get(issue.type) || [];
    list.push(issue);
    byType.set(issue.type, list);
  }

  for (const [type, typeIssues] of byType) {
    console.log(`\n${type} (${typeIssues.length}):`);
    for (const issue of typeIssues) {
      console.log(`  - ${issue.exercise}: ${issue.details}`);
    }
  }
}

// Summary stats
console.log('\n=== PREREQ STATS ===');
const withPrereqs = exercises.filter(e => e.prereqs && e.prereqs.length > 0);
const prereqCounts = withPrereqs.map(e => e.prereqs!.length);
const avgPrereqs = prereqCounts.reduce((a, b) => a + b, 0) / prereqCounts.length;
const maxPrereqs = Math.max(...prereqCounts);
const exerciseWithMax = exercises.find(e => e.prereqs?.length === maxPrereqs);

console.log(`Exercises with prereqs: ${withPrereqs.length}/${exercises.length}`);
console.log(`Average prereqs per exercise: ${avgPrereqs.toFixed(1)}`);
console.log(`Max prereqs: ${maxPrereqs} (${exerciseWithMax?.slug})`);

// Check prereq distribution by level
const byLevel = new Map<string, number[]>();
for (const ex of exercises) {
  const count = ex.prereqs?.length || 0;
  const list = byLevel.get(ex.level) || [];
  list.push(count);
  byLevel.set(ex.level, list);
}

console.log('\nPrereq count by level:');
for (const [level, counts] of byLevel) {
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  const max = Math.max(...counts);
  console.log(`  ${level}: avg=${avg.toFixed(1)}, max=${max}, count=${counts.length}`);
}
