// scripts/generate-exercise-list.ts
// AUTO-GENERATES Exercise-List.md from YAML source of truth
// Usage: npx tsx scripts/generate-exercise-list.ts [--obsidian /path/to/vault]

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';

interface Exercise {
  slug: string;
  title: string;
  prompt: string;
  expected_answer: string;
  type: 'write' | 'fill-in' | 'predict';
  level: 'intro' | 'practice' | 'edge' | 'integrated';
  concept: string;
  subconcept: string;
  generator?: string;
  code?: string;
}

interface YamlFile {
  language: string;
  category: string;
  exercises: Exercise[];
}

interface Beat {
  beat: number;
  exercise: string;
  title: string;
  sideQuests?: string[];
}

interface Blueprint {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  concepts: string[];
  beats: Beat[];
}

interface Skin {
  id: string;
  title: string;
  icon: string;
  blueprints: string[];
  vars: Record<string, unknown>;
  contexts: Record<string, string>;
}

interface PathData {
  blueprints: Blueprint[];
  skins: Skin[];
  exerciseToBlueprints: Map<string, { blueprintId: string; beat: number; beatTitle: string }[]>;
}

interface Stats {
  total: number;
  byType: Record<string, number>;
  byLevel: Record<string, number>;
  byConcept: Record<string, number>;
  bySubconcept: Record<string, Record<string, Exercise[]>>;
  dynamic: number;
  duplicates: string[];
}

const TYPE_ABBREV: Record<string, string> = {
  write: 'W',
  'fill-in': 'F',
  predict: 'P',
};

const LEVEL_ABBREV: Record<string, string> = {
  intro: 'I',
  practice: 'P',
  edge: 'E',
  integrated: 'Int',
};

/**
 * Generate a short abbreviation from a blueprint ID.
 * e.g., "collection-cli-app" -> "CCA", "data-processor" -> "DP"
 */
function blueprintAbbrev(id: string): string {
  // Split by hyphens and take first letter of each word, uppercase
  return id.split('-').map(w => w[0]?.toUpperCase() || '').join('');
}

function parseAllYaml(): { exercises: Exercise[]; stats: Stats } {
  const exercisesDir = join(process.cwd(), 'exercises/python');
  const files = readdirSync(exercisesDir).filter(f => f.endsWith('.yaml'));

  const allExercises: Exercise[] = [];
  const slugSet = new Set<string>();
  const duplicates: string[] = [];

  for (const file of files) {
    const filePath = join(exercisesDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const data = parse(content) as YamlFile;

    for (const exercise of data.exercises) {
      if (slugSet.has(exercise.slug)) {
        duplicates.push(exercise.slug);
      }
      slugSet.add(exercise.slug);
      allExercises.push(exercise);
    }
  }

  // Compute stats
  const stats: Stats = {
    total: allExercises.length,
    byType: {},
    byLevel: {},
    byConcept: {},
    bySubconcept: {},
    dynamic: 0,
    duplicates,
  };

  for (const ex of allExercises) {
    // By type
    stats.byType[ex.type] = (stats.byType[ex.type] || 0) + 1;

    // By level
    stats.byLevel[ex.level] = (stats.byLevel[ex.level] || 0) + 1;

    // By concept
    stats.byConcept[ex.concept] = (stats.byConcept[ex.concept] || 0) + 1;

    // By subconcept (grouped under concept)
    if (!stats.bySubconcept[ex.concept]) {
      stats.bySubconcept[ex.concept] = {};
    }
    if (!stats.bySubconcept[ex.concept][ex.subconcept]) {
      stats.bySubconcept[ex.concept][ex.subconcept] = [];
    }
    stats.bySubconcept[ex.concept][ex.subconcept].push(ex);

    // Dynamic count
    if (ex.generator) {
      stats.dynamic++;
    }
  }

  return { exercises: allExercises, stats };
}

function parsePathData(): PathData {
  const pathsDir = join(process.cwd(), 'paths/python');
  const blueprintsDir = join(pathsDir, 'blueprints');
  const skinsDir = join(pathsDir, 'skins');

  const blueprints: Blueprint[] = [];
  const skins: Skin[] = [];
  const exerciseToBlueprints = new Map<string, { blueprintId: string; beat: number; beatTitle: string }[]>();

  // Parse blueprints
  if (existsSync(blueprintsDir)) {
    const blueprintFiles = readdirSync(blueprintsDir).filter(f => f.endsWith('.yaml'));
    for (const file of blueprintFiles) {
      const filePath = join(blueprintsDir, file);
      const content = readFileSync(filePath, 'utf-8');
      const bp = parse(content) as Blueprint;
      blueprints.push(bp);

      // Build exercise -> blueprint mapping (main exercises + side-quests)
      for (const beat of bp.beats) {
        // Main exercise
        const existing = exerciseToBlueprints.get(beat.exercise) || [];
        existing.push({ blueprintId: bp.id, beat: beat.beat, beatTitle: beat.title });
        exerciseToBlueprints.set(beat.exercise, existing);

        // Side-quest exercises (also belong to this beat)
        if (beat.sideQuests) {
          for (const sqSlug of beat.sideQuests) {
            const sqExisting = exerciseToBlueprints.get(sqSlug) || [];
            sqExisting.push({ blueprintId: bp.id, beat: beat.beat, beatTitle: `${beat.title} (side-quest)` });
            exerciseToBlueprints.set(sqSlug, sqExisting);
          }
        }
      }
    }
  }

  // Parse skins
  if (existsSync(skinsDir)) {
    const skinFiles = readdirSync(skinsDir).filter(f => f.endsWith('.yaml'));
    for (const file of skinFiles) {
      const filePath = join(skinsDir, file);
      const content = readFileSync(filePath, 'utf-8');
      const skin = parse(content) as Skin;
      skins.push(skin);
    }
  }

  return { blueprints, skins, exerciseToBlueprints };
}

function truncateText(text: string, maxLen = 80): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

function escapeMarkdown(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/**
 * Generate BLUEPRINTS.md - Blueprint and Skin documentation
 */
function generateBlueprintsMarkdown(pathData: PathData): string {
  const lines: string[] = [];

  lines.push('<!-- AUTO-GENERATED FILE - DO NOT EDIT -->');
  lines.push('<!-- Generated by: npx tsx scripts/generate-exercise-list.ts -->');
  lines.push('<!-- Source of truth: paths/python/*.yaml -->');
  lines.push('');
  lines.push('# Blueprints & Skins');
  lines.push('');
  lines.push(`> **${pathData.blueprints.length} blueprints** with **${pathData.skins.length} skins** (${pathData.exerciseToBlueprints.size} exercises in blueprints)`);
  lines.push('');
  lines.push('*Blueprints define narrative sequences of exercises. Skins provide domain theming.*');
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const bp of pathData.blueprints) {
    lines.push(`## ${bp.title}`);
    lines.push(`^blueprint-${bp.id}`);
    lines.push('');
    lines.push(`> ${bp.description}`);
    lines.push('');
    lines.push(`**Difficulty:** ${bp.difficulty} | **Concepts:** ${bp.concepts.join(', ')}`);
    lines.push('');

    // Skins for this blueprint
    const bpSkins = pathData.skins.filter(s => s.blueprints?.includes(bp.id));
    if (bpSkins.length > 0) {
      lines.push('**Skins:** ' + bpSkins.map(s => `${s.icon} ${s.title}`).join(' | '));
      lines.push('');
    }

    // Beats table
    lines.push('| Beat | Exercise | Title |');
    lines.push('|------|----------|-------|');
    for (const beat of bp.beats) {
      const sq = beat.sideQuests?.length ? ` (+${beat.sideQuests.length} side-quest${beat.sideQuests.length > 1 ? 's' : ''})` : '';
      lines.push(`| ${beat.beat} | \`${beat.exercise}\` | ${beat.title}${sq} |`);
    }
    lines.push('');
  }

  // Global skins section
  const globalSkins = pathData.skins.filter(s => !s.blueprints || s.blueprints.length === 0);
  if (globalSkins.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Global Skins');
    lines.push('');
    lines.push('*These skins work with any blueprint.*');
    lines.push('');
    for (const skin of globalSkins) {
      const contextCount = Object.keys(skin.contexts || {}).length;
      lines.push(`- ${skin.icon} **${skin.title}** (${contextCount} context entries)`);
    }
    lines.push('');
  }

  // Skins detail
  lines.push('---');
  lines.push('');
  lines.push('## Skin Details');
  lines.push('');
  lines.push('| Skin | Icon | Blueprints | Context Entries |');
  lines.push('|------|------|------------|-----------------|');
  for (const skin of pathData.skins) {
    const contextCount = Object.keys(skin.contexts || {}).length;
    const bpList = skin.blueprints?.join(', ') || '(global)';
    lines.push(`| ${skin.title} | ${skin.icon} | ${bpList} | ${contextCount} |`);
  }
  lines.push('');

  // Blueprint abbreviation legend
  lines.push('---');
  lines.push('');
  lines.push('## Blueprint Abbreviations');
  lines.push('');
  lines.push('Used in exercise tables:');
  lines.push('');
  for (const bp of pathData.blueprints) {
    lines.push(`- **${blueprintAbbrev(bp.id)}** = ${bp.id}`);
  }
  lines.push('');

  // Timestamp
  const now = new Date().toISOString().split('T')[0];
  lines.push('---');
  lines.push('');
  lines.push(`*Generated: ${now} from YAML source of truth*`);

  return lines.join('\n');
}

/**
 * Generate GRADING-RUBRIC.md - Exercise quality rubric
 */
function generateRubricMarkdown(): string {
  const lines: string[] = [];

  lines.push('<!-- AUTO-GENERATED FILE - DO NOT EDIT -->');
  lines.push('<!-- Generated by: npx tsx scripts/generate-exercise-list.ts -->');
  lines.push('');
  lines.push('# Exercise Grading Rubric');
  lines.push('');
  lines.push('Use this rubric when reviewing exercise quality. **8 dimensions** (1-5 scale) plus a prerequisite gate.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Prerequisite: Code Correctness Gate');
  lines.push('');
  lines.push('Before scoring, verify the expected_answer actually solves the prompt correctly.');
  lines.push('');
  lines.push('| Status | Action |');
  lines.push('|--------|--------|');
  lines.push('| **PASS** | Expected answer is logically complete and correct → proceed with rubric |');
  lines.push('| **FAIL** | Expected answer is broken, incomplete, or wrong → fix before scoring |');
  lines.push('');
  lines.push('*Example failure: A loop that breaks without capturing the result, or a prompt asking to "return" but no function context.*');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 1. Transfer Value (Tr)');
  lines.push('');
  lines.push('*Does it matter outside this app?*');
  lines.push('');
  lines.push('| Score | Description |');
  lines.push('|-------|-------------|');
  lines.push('| 5 | Core skill used daily in production code |');
  lines.push('| 4 | Common pattern, good muscle memory to have |');
  lines.push('| 3 | Useful but situational |');
  lines.push('| 2 | Edge case knowledge, rarely needed |');
  lines.push('| 1 | Platform-specific or artificial constraint |');
  lines.push('');
  lines.push('## 2. Cognitive Load Match (Cg)');
  lines.push('');
  lines.push('*Level vs actual difficulty*');
  lines.push('');
  lines.push('| Score | Description |');
  lines.push('|-------|-------------|');
  lines.push('| 5 | Level perfectly matches cognitive demand |');
  lines.push('| 4 | Slightly over/under for level, acceptable |');
  lines.push('| 3 | Noticeable mismatch but defensible |');
  lines.push('| 2 | Wrong level - confuses progression |');
  lines.push('| 1 | Grossly misplaced (intro feels like edge) |');
  lines.push('');
  lines.push('## 3. Decision Depth (Dd)');
  lines.push('');
  lines.push('*Choice vs recall*');
  lines.push('');
  lines.push('| Score | Description |');
  lines.push('|-------|-------------|');
  lines.push('| 5 | Multiple valid approaches, learner must think |');
  lines.push('| 4 | One clear best approach, but reasoning required |');
  lines.push('| 3 | Pattern application with minor decisions |');
  lines.push('| 2 | Direct recall with small variation |');
  lines.push('| 1 | Pure token recall (fill-in single character) |');
  lines.push('');
  lines.push('**Target Dd by Level** (these are *correct* scores, not deficiencies):');
  lines.push('');
  lines.push('| Level | Target Dd | Rationale |');
  lines.push('|-------|-----------|-----------|');
  lines.push('| Intro | 1-2 | Pattern recognition, not problem-solving |');
  lines.push('| Practice | 3-4 | Apply with minor decisions |');
  lines.push('| Edge | 4-5 | Multiple valid approaches |');
  lines.push('| Integrated | 5 | Requires synthesis and choice |');
  lines.push('');
  lines.push('## 4. Narrative Versatility (Nv)');
  lines.push('');
  lines.push('*Skin system compatibility*');
  lines.push('');
  lines.push('| Score | Description |');
  lines.push('|-------|-------------|');
  lines.push('| 5 | Universal AND actively uses skin variables for data/context |');
  lines.push('| 4 | Adapts to most domains, uses some skin variables |');
  lines.push('| 3 | Works in several domains but uses hardcoded data |');
  lines.push('| 2 | Narrow - only fits 1-2 specific narratives |');
  lines.push('| 1 | Contrived - feels artificial in any story |');
  lines.push('');
  lines.push('*Key: An exercise can theoretically fit any domain (old Nv=5) but score Nv=3 if it has hardcoded data like `{"apple": 1.50}` instead of using skin vars.*');
  lines.push('');
  lines.push('## 5. Answer Determinism (Ad)');
  lines.push('');
  lines.push('*Is the correct answer unambiguous?*');
  lines.push('');
  lines.push('| Score | Description |');
  lines.push('|-------|-------------|');
  lines.push('| 5 | Single canonical form (fill-in token, exact output) |');
  lines.push('| 4 | Few valid forms, all structurally similar |');
  lines.push('| 3 | Multiple valid approaches exist |');
  lines.push('| 2 | Many reasonable interpretations of "correct" |');
  lines.push('| 1 | Highly subjective or open-ended |');
  lines.push('');
  lines.push('## 6. Coverage Completeness (Cc)');
  lines.push('');
  lines.push('*Are valid variations captured?*');
  lines.push('');
  lines.push('| Score | Description |');
  lines.push('|-------|-------------|');
  lines.push('| 5 | All reasonable alternatives in accepted_solutions |');
  lines.push('| 4 | Most alternatives covered, minor gaps |');
  lines.push('| 3 | Common alternatives covered, some missing |');
  lines.push('| 2 | Significant valid solutions not accepted |');
  lines.push('| 1 | High false-negative risk (correct answers rejected) |');
  lines.push('');
  lines.push('*Note: For fill-in/predict with Ad=5, Cc is effectively N/A (score 5). The Ad/Cc split matters most for write exercises.*');
  lines.push('');
  lines.push('## 7. Idiom Quality (Id)');
  lines.push('');
  lines.push('*Teaching good habits?*');
  lines.push('');
  lines.push('| Score | Description |');
  lines.push('|-------|-------------|');
  lines.push('| 5 | Teaches Pythonic best practice explicitly |');
  lines.push('| 4 | Standard approach, no bad habits |');
  lines.push('| 3 | Neutral - neither good nor bad pattern |');
  lines.push('| 2 | Could reinforce brittle template thinking |');
  lines.push('| 1 | Actively teaches anti-pattern |');
  lines.push('');
  lines.push('## 8. Prompt Clarity (Pc)');
  lines.push('');
  lines.push('*Is the question well-written?*');
  lines.push('');
  lines.push('| Score | Description |');
  lines.push('|-------|-------------|');
  lines.push('| 5 | Crystal clear, single interpretation, complete spec |');
  lines.push('| 4 | Clear with minor verbosity or ambiguity |');
  lines.push('| 3 | Understandable but could confuse some learners |');
  lines.push('| 2 | Ambiguous, missing output format, or overly wordy |');
  lines.push('| 1 | Confusing, misleading, or contradicts expected answer |');
  lines.push('');
  lines.push('**Pc Checklist:**');
  lines.push('- [ ] Single interpretation?');
  lines.push('- [ ] Output format specified? (print vs return vs assign)');
  lines.push('- [ ] Actionable hints?');
  lines.push('- [ ] No unexplained jargon?');
  lines.push('- [ ] Template vars used appropriately? (never as code identifiers)');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Scoring Thresholds (out of 40)');
  lines.push('');
  lines.push('- **35-40**: Excellent - publish as-is');
  lines.push('- **28-34**: Good - minor polish needed');
  lines.push('- **20-27**: Acceptable - review before publishing');
  lines.push('- **<20**: Needs rework');
  lines.push('');
  lines.push('## Level-Specific Weights');
  lines.push('');
  lines.push('| Criterion | Intro | Practice | Edge | Integrated |');
  lines.push('|-----------|-------|----------|------|------------|');
  lines.push('| Transfer (Tr) | ★★★★★ | ★★★★☆ | ★★★☆☆ | ★★★★★ |');
  lines.push('| Cognitive Match (Cg) | ★★★★★ | ★★★★★ | ★★★★★ | ★★★★★ |');
  lines.push('| Decision Depth (Dd) | ★★☆☆☆ | ★★★☆☆ | ★★★★☆ | ★★★★★ |');
  lines.push('| Narrative Vers. (Nv) | ★★★★☆ | ★★★★☆ | ★★★☆☆ | ★★★★★ |');
  lines.push('| Answer Determ. (Ad) | ★★★★★ | ★★★★☆ | ★★★☆☆ | ★★★☆☆ |');
  lines.push('| Coverage Compl. (Cc) | ★★★★★ | ★★★★★ | ★★★★☆ | ★★★☆☆ |');
  lines.push('| Idiom Quality (Id) | ★★★★☆ | ★★★★★ | ★★★★★ | ★★★★★ |');
  lines.push('| Prompt Clarity (Pc) | ★★★★★ | ★★★★★ | ★★★★★ | ★★★★★ |');
  lines.push('');

  // Timestamp
  const now = new Date().toISOString().split('T')[0];
  lines.push('---');
  lines.push('');
  lines.push(`*Generated: ${now}*`);

  return lines.join('\n');
}

/**
 * Generate EXERCISES.md - Exercise list (without grading columns)
 */
function generateExercisesMarkdown(stats: Stats, pathData: PathData): string {
  const lines: string[] = [];

  // Header with warning
  lines.push('<!-- AUTO-GENERATED FILE - DO NOT EDIT -->');
  lines.push('<!-- Generated by: npx tsx scripts/generate-exercise-list.ts -->');
  lines.push('<!-- Source of truth: exercises/python/*.yaml -->');
  lines.push('');
  lines.push('# Exercise List');
  lines.push('');
  lines.push(`> **${stats.total} exercises** across ${Object.keys(stats.byConcept).length} concepts`);
  lines.push('');
  lines.push('See also: [Blueprints](BLUEPRINTS.md) | [Grading Rubric](GRADING-RUBRIC.md)');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Summary table
  lines.push('## Summary');
  lines.push('');
  lines.push('| Type | Count | Level | Count |');
  lines.push('|------|-------|-------|-------|');
  lines.push(`| write | ${stats.byType.write || 0} | intro | ${stats.byLevel.intro || 0} |`);
  lines.push(`| fill-in | ${stats.byType['fill-in'] || 0} | practice | ${stats.byLevel.practice || 0} |`);
  lines.push(`| predict | ${stats.byType.predict || 0} | edge | ${stats.byLevel.edge || 0} |`);
  lines.push(`| **Dynamic** | **${stats.dynamic}** | integrated | ${stats.byLevel.integrated || 0} |`);
  lines.push('');

  // Duplicates warning
  if (stats.duplicates.length > 0) {
    lines.push('> ⚠️ **Duplicate slugs found:** ' + stats.duplicates.join(', '));
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // Contents (sorted by concept name)
  lines.push('## Contents');
  lines.push('');
  const sortedConcepts = Object.keys(stats.byConcept).sort();
  for (const concept of sortedConcepts) {
    lines.push(`- [[#^${concept}|${concept}]] (${stats.byConcept[concept]})`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // Each concept section
  for (const concept of sortedConcepts) {
    const conceptCount = stats.byConcept[concept];
    lines.push(`## ${capitalize(concept)} (${conceptCount})`);
    lines.push(`^${concept}`);
    lines.push('');

    const subconcepts = stats.bySubconcept[concept];
    const sortedSubconcepts = Object.keys(subconcepts).sort();

    for (const subconcept of sortedSubconcepts) {
      const exercises = subconcepts[subconcept];
      lines.push(`### ${subconcept} (${exercises.length})`);
      lines.push('');
      lines.push('| # | Type | Level | Prompt | Code | Answer | Dyn | BP |');
      lines.push('|---|------|-------|--------|------|--------|-----|----| ');

      // Sort exercises by level order, then by slug
      const levelOrder = ['intro', 'practice', 'edge', 'integrated'];
      const sorted = [...exercises].sort((a, b) => {
        const levelDiff = levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level);
        if (levelDiff !== 0) return levelDiff;
        return a.slug.localeCompare(b.slug);
      });

      sorted.forEach((ex, i) => {
        const typeAbbrev = TYPE_ABBREV[ex.type] || ex.type;
        const levelAbbrev = LEVEL_ABBREV[ex.level] || ex.level;
        const prompt = escapeMarkdown(truncateText(ex.prompt));
        const code = ex.code ? '`' + escapeMarkdown(truncateText(ex.code, 60)) + '`' : '';
        const answer = '`' + escapeMarkdown(truncateText(ex.expected_answer, 50)) + '`';
        const dynamic = ex.generator ? '✓' : '';
        // Check if exercise is in a blueprint - show abbreviation:beat (e.g., CCA:1)
        const bpRefs = pathData.exerciseToBlueprints.get(ex.slug);
        const bpCol = bpRefs ? bpRefs.map(r => `${blueprintAbbrev(r.blueprintId)}:${r.beat}`).join(', ') : '';
        lines.push(`| ${i + 1} | ${typeAbbrev} | ${levelAbbrev} | ${prompt} | ${code} | ${answer} | ${dynamic} | ${bpCol} |`);
      });

      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  // Legend
  lines.push('## Legend');
  lines.push('');
  lines.push('| Column | Meaning |');
  lines.push('|--------|---------|');
  lines.push('| **Type** | W=Write, F=Fill-in, P=Predict |');
  lines.push('| **Level** | I=Intro, P=Practice, E=Edge, Int=Integrated |');
  lines.push('| **Code** | Code snippet for predict exercises |');
  lines.push('| **Dyn** | ✓ = Dynamic exercise (values change) |');
  lines.push('| **BP** | Blueprint:Beat (e.g., CCA:1 = collection-cli-app beat 1) |');
  lines.push('');

  // Blueprint abbreviation legend
  if (pathData.blueprints.length > 0) {
    lines.push('**Blueprint Abbreviations:**');
    const abbrevList = pathData.blueprints
      .map(bp => `${blueprintAbbrev(bp.id)}=${bp.id}`)
      .join(', ');
    lines.push(abbrevList);
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // Timestamp
  const now = new Date().toISOString().split('T')[0];
  lines.push(`*Generated: ${now} from YAML source of truth*`);

  return lines.join('\n');
}

function capitalize(s: string): string {
  return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function main() {
  console.log('📋 Parsing YAML files...');
  const { stats } = parseAllYaml();

  console.log('📦 Parsing blueprints & skins...');
  const pathData = parsePathData();

  console.log(`\n📊 Statistics:`);
  console.log(`   Total exercises: ${stats.total}`);
  console.log(`   Dynamic: ${stats.dynamic}`);
  console.log(`   Blueprints: ${pathData.blueprints.length}`);
  console.log(`   Skins: ${pathData.skins.length}`);
  console.log(`   Exercises in blueprints: ${pathData.exerciseToBlueprints.size}`);
  console.log(`   By type: write=${stats.byType.write || 0}, fill-in=${stats.byType['fill-in'] || 0}, predict=${stats.byType.predict || 0}`);
  console.log(`   By level: intro=${stats.byLevel.intro || 0}, practice=${stats.byLevel.practice || 0}, edge=${stats.byLevel.edge || 0}, integrated=${stats.byLevel.integrated || 0}`);

  if (stats.duplicates.length > 0) {
    console.log(`\n⚠️  Duplicates found: ${stats.duplicates.join(', ')}`);
  }

  console.log('\n📝 Generating markdown files...');
  const exercisesMd = generateExercisesMarkdown(stats, pathData);
  const blueprintsMd = generateBlueprintsMarkdown(pathData);
  const rubricMd = generateRubricMarkdown();

  // Require --obsidian flag with vault path
  const obsidianIndex = process.argv.indexOf('--obsidian');
  if (obsidianIndex === -1 || !process.argv[obsidianIndex + 1]) {
    console.error('❌ Error: --obsidian <vault-path> is required');
    console.error('   Usage: npx tsx scripts/generate-exercise-list.ts --obsidian "/path/to/Obsidian Vault"');
    process.exit(1);
  }

  const obsidianDir = join(process.argv[obsidianIndex + 1], 'SRS-app');

  // Ensure directory exists
  if (!existsSync(obsidianDir)) {
    mkdirSync(obsidianDir, { recursive: true });
  }

  writeFileSync(join(obsidianDir, 'Exercise-List.md'), exercisesMd);
  console.log(`✓ Written to ${join(obsidianDir, 'Exercise-List.md')}`);

  writeFileSync(join(obsidianDir, 'Blueprints.md'), blueprintsMd);
  console.log(`✓ Written to ${join(obsidianDir, 'Blueprints.md')}`);

  writeFileSync(join(obsidianDir, 'Grading-Rubric.md'), rubricMd);
  console.log(`✓ Written to ${join(obsidianDir, 'Grading-Rubric.md')}`);

  console.log('\n✅ Done!');

  // Return stats for validation
  return stats;
}

// Export for use in validation
export { parseAllYaml };
export type { Stats };

main();
