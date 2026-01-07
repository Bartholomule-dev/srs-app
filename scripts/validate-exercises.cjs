/**
 * Comprehensive exercise metadata validation script
 * Checks all exercises against the curriculum definition
 */
require('dotenv').config({ path: '.env.test.local' });
const yaml = require('yaml');
const fs = require('fs');
const path = require('path');

const curriculum = require('../src/lib/curriculum/python.json');

// Valid values
const VALID_TYPES = ['write', 'fill-in', 'predict'];
const VALID_LEVELS = ['intro', 'practice', 'edge', 'integrated'];

// Build lookup maps from curriculum
// concepts is an ARRAY of objects with slug property
const validConcepts = new Set(curriculum.concepts.map(c => c.slug));
const validSubconcepts = new Set(Object.keys(curriculum.subconcepts));
const subconceptToConcept = new Map();

// Map each subconcept to its parent concept
for (const [subSlug, subDef] of Object.entries(curriculum.subconcepts)) {
  subconceptToConcept.set(subSlug, subDef.concept);
}

console.log('=== Curriculum Structure ===');
console.log(`Valid concepts (${validConcepts.size}):`, [...validConcepts].join(', '));
console.log(`Valid subconcepts (${validSubconcepts.size}):`, [...validSubconcepts].join(', '));
console.log('');

// Load all exercises
const exerciseDir = path.join(__dirname, '../exercises/python');
const exerciseFiles = fs.readdirSync(exerciseDir).filter(f => f.endsWith('.yaml'));
const allExercises = new Map();
const exercisesBySubconcept = new Map();

for (const file of exerciseFiles) {
  const content = fs.readFileSync(path.join(exerciseDir, file), 'utf8');
  const data = yaml.parse(content);
  if (data?.exercises) {
    for (const ex of data.exercises) {
      ex._file = file;
      allExercises.set(ex.slug, ex);

      const subList = exercisesBySubconcept.get(ex.subconcept) || [];
      subList.push(ex);
      exercisesBySubconcept.set(ex.subconcept, subList);
    }
  }
}

console.log(`Total exercises loaded: ${allExercises.size}`);
console.log('');

// Track issues
const issues = [];

// === Check 1: Validate concepts ===
console.log('=== Check 1: Exercise Concepts ===');
for (const [slug, ex] of allExercises) {
  if (!validConcepts.has(ex.concept)) {
    issues.push({
      type: 'INVALID_CONCEPT',
      file: ex._file,
      slug,
      message: `Invalid concept "${ex.concept}" - valid: ${[...validConcepts].join(', ')}`
    });
  }
}
const conceptIssues = issues.filter(i => i.type === 'INVALID_CONCEPT');
console.log(`Issues: ${conceptIssues.length}`);
conceptIssues.forEach(i => console.log(`  ✗ ${i.file}: ${i.slug} - ${i.message}`));
console.log('');

// === Check 2: Validate subconcepts ===
console.log('=== Check 2: Exercise Subconcepts ===');
for (const [slug, ex] of allExercises) {
  if (!validSubconcepts.has(ex.subconcept)) {
    issues.push({
      type: 'INVALID_SUBCONCEPT',
      file: ex._file,
      slug,
      message: `Invalid subconcept "${ex.subconcept}" - not defined in curriculum`
    });
  }
}
const subconceptIssues = issues.filter(i => i.type === 'INVALID_SUBCONCEPT');
console.log(`Issues: ${subconceptIssues.length}`);
subconceptIssues.forEach(i => console.log(`  ✗ ${i.file}: ${i.slug} - ${i.message}`));
console.log('');

// === Check 3: Subconcept belongs to correct concept ===
console.log('=== Check 3: Subconcept-Concept Mapping ===');
for (const [slug, ex] of allExercises) {
  const expectedConcept = subconceptToConcept.get(ex.subconcept);
  if (expectedConcept && ex.concept !== expectedConcept) {
    issues.push({
      type: 'CONCEPT_MISMATCH',
      file: ex._file,
      slug,
      message: `Subconcept "${ex.subconcept}" belongs to concept "${expectedConcept}", not "${ex.concept}"`
    });
  }
}
const mismatchIssues = issues.filter(i => i.type === 'CONCEPT_MISMATCH');
console.log(`Issues: ${mismatchIssues.length}`);
mismatchIssues.forEach(i => console.log(`  ✗ ${i.file}: ${i.slug} - ${i.message}`));
console.log('');

// === Check 4: Exercise types ===
console.log('=== Check 4: Exercise Types ===');
for (const [slug, ex] of allExercises) {
  const type = ex.type || ex.exerciseType;
  if (!VALID_TYPES.includes(type)) {
    issues.push({
      type: 'INVALID_TYPE',
      file: ex._file,
      slug,
      message: `Invalid type "${type}" - valid: ${VALID_TYPES.join(', ')}`
    });
  }
}
const typeIssues = issues.filter(i => i.type === 'INVALID_TYPE');
console.log(`Issues: ${typeIssues.length}`);
typeIssues.forEach(i => console.log(`  ✗ ${i.file}: ${i.slug} - ${i.message}`));
console.log('');

// === Check 5: Exercise levels ===
console.log('=== Check 5: Exercise Levels ===');
for (const [slug, ex] of allExercises) {
  if (!VALID_LEVELS.includes(ex.level)) {
    issues.push({
      type: 'INVALID_LEVEL',
      file: ex._file,
      slug,
      message: `Invalid level "${ex.level}" - valid: ${VALID_LEVELS.join(', ')}`
    });
  }
}
const levelIssues = issues.filter(i => i.type === 'INVALID_LEVEL');
console.log(`Issues: ${levelIssues.length}`);
levelIssues.forEach(i => console.log(`  ✗ ${i.file}: ${i.slug} - ${i.message}`));
console.log('');

// === Check 6: Prerequisites ===
console.log('=== Check 6: Prerequisites ===');
for (const [slug, ex] of allExercises) {
  if (ex.prereqs && Array.isArray(ex.prereqs)) {
    for (const prereq of ex.prereqs) {
      // Handle both "subconcept" and "concept.subconcept" formats
      const normalizedPrereq = prereq.includes('.') ? prereq.split('.').pop() : prereq;

      // Also check if it's a concept name (valid as prereq)
      if (!validSubconcepts.has(normalizedPrereq) && !validConcepts.has(prereq)) {
        // Check if the dotted format is wrong
        if (prereq.includes('.')) {
          issues.push({
            type: 'DOTTED_PREREQ',
            file: ex._file,
            slug,
            message: `Prereq uses dot notation "${prereq}" - should just be "${normalizedPrereq}"`
          });
        } else {
          issues.push({
            type: 'INVALID_PREREQ',
            file: ex._file,
            slug,
            message: `Invalid prereq "${prereq}" - not a valid subconcept or concept`
          });
        }
      }
    }
  }
}
const prereqIssues = issues.filter(i => i.type === 'INVALID_PREREQ');
const dottedPrereqIssues = issues.filter(i => i.type === 'DOTTED_PREREQ');
console.log(`Invalid prereqs: ${prereqIssues.length}`);
prereqIssues.forEach(i => console.log(`  ✗ ${i.file}: ${i.slug} - ${i.message}`));
console.log(`Dotted notation prereqs: ${dottedPrereqIssues.length}`);
if (dottedPrereqIssues.length > 0 && dottedPrereqIssues.length <= 20) {
  dottedPrereqIssues.forEach(i => console.log(`  ⚠ ${i.file}: ${i.slug} - ${i.message}`));
} else if (dottedPrereqIssues.length > 20) {
  console.log(`  (showing first 10)`);
  dottedPrereqIssues.slice(0, 10).forEach(i => console.log(`  ⚠ ${i.file}: ${i.slug} - ${i.message}`));
}
console.log('');

// === Check 7: Teaching Example Content ===
console.log('=== Check 7: Teaching Example Content ===');
for (const [subSlug, subDef] of Object.entries(curriculum.subconcepts)) {
  const hasExampleCode = !!subDef.teaching?.exampleCode;
  const hasExampleSlug = !!subDef.teaching?.exampleSlug;

  // Must have either exampleCode or valid exampleSlug
  if (!hasExampleCode && !hasExampleSlug) {
    issues.push({
      type: 'MISSING_EXAMPLE',
      file: 'python.json',
      slug: subSlug,
      message: `Teaching needs either exampleCode or exampleSlug`
    });
  }

  // If using exampleSlug, validate it exists
  if (hasExampleSlug && !hasExampleCode) {
    if (!allExercises.has(subDef.teaching.exampleSlug)) {
      issues.push({
        type: 'MISSING_EXAMPLE',
        file: 'python.json',
        slug: subSlug,
        message: `Teaching exampleSlug "${subDef.teaching.exampleSlug}" not found in exercises`
      });
    }
  }

  // Warn if still using exampleSlug without exampleCode
  if (hasExampleSlug && !hasExampleCode) {
    console.log(`  ⚠ ${subSlug}: using deprecated exampleSlug, consider adding exampleCode`);
  }
}
const exampleIssues = issues.filter(i => i.type === 'MISSING_EXAMPLE');
console.log(`Issues: ${exampleIssues.length}`);
exampleIssues.forEach(i => console.log(`  ✗ ${i.file}: ${i.slug} - ${i.message}`));
console.log('');

// === Check 8: Subconcepts have enough exercises for teaching pairs ===
console.log('=== Check 8: Teaching Pair Viability ===');
for (const [subSlug, subDef] of Object.entries(curriculum.subconcepts)) {
  if (subDef.teaching?.exampleSlug) {
    const exampleSlug = subDef.teaching.exampleSlug;
    const subExercises = exercisesBySubconcept.get(subSlug) || [];
    const practiceExercises = subExercises.filter(e => e.slug !== exampleSlug);

    if (practiceExercises.length === 0) {
      issues.push({
        type: 'NO_PRACTICE_EXERCISES',
        file: 'curriculum',
        slug: subSlug,
        message: `Subconcept has ${subExercises.length} exercise(s) but none besides the example "${exampleSlug}" for practice`
      });
    }
  }
}
const practiceIssues = issues.filter(i => i.type === 'NO_PRACTICE_EXERCISES');
console.log(`Issues: ${practiceIssues.length}`);
practiceIssues.forEach(i => console.log(`  ✗ ${i.slug} - ${i.message}`));
console.log('');

// === Check 9: Targets field for integrated exercises ===
console.log('=== Check 9: Integrated Exercise Targets ===');
for (const [slug, ex] of allExercises) {
  if (ex.level === 'integrated') {
    if (!ex.targets || !Array.isArray(ex.targets) || ex.targets.length === 0) {
      issues.push({
        type: 'MISSING_TARGETS',
        file: ex._file,
        slug,
        message: 'Integrated exercises must have "targets" array'
      });
    } else {
      for (const target of ex.targets) {
        if (!validSubconcepts.has(target)) {
          issues.push({
            type: 'INVALID_TARGET',
            file: ex._file,
            slug,
            message: `Invalid target "${target}" - not a valid subconcept`
          });
        }
      }
    }
  }
}
const targetIssues = issues.filter(i => i.type === 'MISSING_TARGETS' || i.type === 'INVALID_TARGET');
console.log(`Issues: ${targetIssues.length}`);
targetIssues.forEach(i => console.log(`  ✗ ${i.file}: ${i.slug} - ${i.message}`));
console.log('');

// === Summary ===
console.log('=== SUMMARY ===');
console.log(`Total issues found: ${issues.length}`);

if (issues.length === 0) {
  console.log('\n✅ All exercises have valid metadata!');
} else {
  console.log('\n❌ Issues by type:');
  const byType = {};
  for (const issue of issues) {
    byType[issue.type] = (byType[issue.type] || 0) + 1;
  }
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`);
  }
}

// Output detailed list for fixing
if (issues.length > 0) {
  console.log('\n=== DETAILED ISSUES FOR FIXING ===');
  for (const issue of issues) {
    console.log(`${issue.type} | ${issue.file} | ${issue.slug} | ${issue.message}`);
  }
}

process.exit(issues.length > 0 ? 1 : 0);
