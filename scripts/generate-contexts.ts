// scripts/generate-contexts.ts
// Replaces placeholder contexts in skin files with domain-appropriate text.

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { parse, stringify } from 'yaml';

const SKINS_DIR = join(process.cwd(), 'paths/python/skins');
const EXERCISES_DIR = join(process.cwd(), 'exercises/python');

interface Exercise {
  slug: string;
  title: string;
  objective: string;
  concept: string;
  subconcept: string;
  level?: string;
  pattern?: string;
}

interface SkinVars {
  list_name: string;
  item_singular: string;
  item_plural: string;
  entity_name?: string;
  attr_key_1?: string;
  attr_key_2?: string;
  status_var?: string;
  action_verb?: string;
  filename?: string;
  user_role?: string;
  [key: string]: string | string[] | undefined;
}

interface Skin {
  id: string;
  title: string;
  vars: SkinVars;
  contexts: Record<string, string>;
}

// Load all exercises from YAML files
async function loadExercises(): Promise<Map<string, Exercise>> {
  const exercises = new Map<string, Exercise>();
  const files = await readdir(EXERCISES_DIR);

  for (const file of files.filter(f => f.endsWith('.yaml'))) {
    const content = await readFile(join(EXERCISES_DIR, file), 'utf-8');
    const data = parse(content) as { exercises: Exercise[] };
    for (const ex of data.exercises || []) {
      exercises.set(ex.slug, ex);
    }
  }
  return exercises;
}

// Context templates based on slug patterns (most specific first)
const SLUG_TEMPLATES: [RegExp, (vars: SkinVars, title: string) => string][] = [
  // Integrated exercises - map to their core functionality
  [/active-users-integrated/, (v) => `Find ${v.item_plural} with their position in the ${v.list_name}.`],
  [/api-response-model-integrated/, (v) => `Define a data model for ${v.entity_name || v.item_singular} API responses.`],
  [/apply-coupon/, (v) => `Apply a discount to ${v.item_plural} in the ${v.list_name}.`],
  [/config-loader-integrated/, (v) => `Safely load ${v.item_singular} configuration from JSON.`],
  [/error-code-extractor-integrated/, (v) => `Extract error codes from ${v.item_singular} operation results.`],
  [/health-check-dataclass-integrated/, (v) => `Create a health check status for ${v.item_singular} services.`],
  [/retry-decorator-integrated/, (v) => `Retry failed ${v.item_singular} operations automatically.`],

  // Boolean operations
  [/boolean-all-check/, (v) => `Check if all ${v.item_plural} in ${v.list_name} meet a condition.`],
  [/boolean-any/, (v) => `Check if any ${v.item_singular} in ${v.list_name} matches.`],
  [/conditional-list-any/, (v) => `Check if any ${v.item_singular} meets the criteria.`],

  // Conditionals
  [/conditional-dict-validation/, (v) => `Validate ${v.item_singular} data before processing.`],
  [/conditional-early-return/, (v) => `Guard against invalid ${v.item_singular} data early.`],
  [/discount-tier-elif/, (v) => `Categorize ${v.item_plural} by tier or level.`],
  [/order-status-ternary/, (v) => `Set ${v.item_singular} status label in one line.`],
  [/validate-order-status/, (v) => `Validate ${v.item_singular} status before changes.`],

  // Dict operations
  [/dict-from-parallel-lists/, (v) => `Combine ${v.item_singular} keys and values into a dictionary.`],
  [/list-to-dict-conversion/, (v) => `Convert ${v.list_name} to a lookup dictionary.`],
  [/fstring-from-dict/, (v) => `Format ${v.item_singular} details from a dictionary.`],
  [/inventory-dict-comp/, (v) => `Build a ${v.item_singular} lookup using dict comprehension.`],

  // File operations
  [/export-orders-csv/, (v) => `Export ${v.list_name} to a CSV file.`],
  [/file-read-to-list/, (v) => `Load ${v.list_name} from a file into a list.`],
  [/file-write-from-list/, (v) => `Save ${v.list_name} to a file.`],
  [/error-handling-file-read/, (v) => `Handle errors when loading ${v.item_singular} data.`],
  [/import-json-parse/, (v) => `Parse ${v.item_singular} data from JSON format.`],

  // Filtering and sorting
  [/filter-list-of-dicts/, (v) => `Filter ${v.list_name} by ${v.status_var || 'status'} value.`],
  [/filter-orders-fn/, (v) => `Create a function to filter ${v.list_name}.`],
  [/high-value-orders-comp/, (v) => `Find high-value ${v.item_plural} using comprehension.`],
  [/sort-dict-by-value/, (v) => `Sort ${v.item_plural} by their values.`],
  [/sorted-key-lambda/, (v) => `Sort ${v.list_name} using a custom key.`],

  // Loops
  [/for-else/, (v) => `Handle the case when no ${v.item_singular} is found.`],
  [/inventory-reorder-loop/, (v) => `Loop through ${v.list_name} and flag items for reorder.`],
  [/loop-dict-accumulate/, (v) => `Sum values from ${v.item_singular} data.`],
  [/loop-nested-flatten/, (v) => `Flatten nested ${v.list_name} into a single list.`],

  // String operations
  [/string-join-transformed/, (v) => `Join ${v.item_plural} into a formatted string.`],
  [/string-split-filter/, (v) => `Split and filter ${v.item_singular} text.`],
  [/parse-events-log/, (v) => `Parse ${v.item_singular} event log entries.`],
  [/orders-parse-to-records/, (v) => `Parse ${v.item_singular} lines into records.`],

  // Numbers
  [/number-round-format/, (v) => `Round and format ${v.item_singular} values.`],
  [/number-stats-from-list/, (v) => `Calculate statistics from ${v.list_name}.`],
  [/parse-quantity-safe/, (v) => `Safely parse ${v.item_singular} quantity.`],
  [/input-to-int/, (v) => `Convert user input to ${v.item_singular} quantity.`],

  // OOP
  [/inventory-item-class/, (v) => `Define a ${v.entity_name || v.item_singular} class.`],
  [/order-total-method/, (v) => `Add a method to calculate ${v.item_singular} total.`],

  // Error handling
  [/error-handling-conversion/, (v) => `Handle type conversion errors for ${v.item_singular}.`],
  [/error-handling-dict-access/, (v) => `Safely access ${v.item_singular} dictionary keys.`],
  [/process-orders-with-guard/, (v) => `Process ${v.list_name} with cleanup on errors.`],

  // Collections
  [/list-dedup-preserve-order/, (v) => `Remove duplicate ${v.item_plural} while keeping order.`],
  [/product-tags-to-set/, (v) => `Get unique ${v.item_singular} tags as a set.`],
  [/orders-total-accumulator/, (v) => `Accumulate totals across ${v.list_name}.`],
  [/summarize-customers/, (v) => `Count active ${v.item_plural} in ${v.list_name}.`],

  // Functions
  [/typehint-callable/, (v) => `Add type hints to ${v.item_singular} processing function.`],
];

// Subconcept-based templates (fallback)
const SUBCONCEPT_TEMPLATES: Record<string, (v: SkinVars) => string> = {
  // Collections
  'lists': (v) => `Manage the ${v.list_name} collection.`,
  'dicts': (v) => `Store ${v.item_singular} data with key-value pairs.`,
  'dict-iteration': (v) => `Loop through ${v.item_singular} data entries.`,
  'sets': (v) => `Track unique ${v.item_singular} values.`,
  'tuples': (v) => `Group related ${v.item_singular} data.`,

  // Loops
  'for': (v) => `Process each ${v.item_singular} in ${v.list_name}.`,
  'while': (v) => `Repeat until ${v.item_singular} condition is met.`,
  'enumerate': (v) => `Track position while iterating ${v.list_name}.`,

  // Conditionals
  'if-else': (v) => `Make decisions based on ${v.item_singular} properties.`,
  'elif-chains': (v) => `Categorize ${v.item_plural} into groups.`,
  'ternary': (v) => `Choose between ${v.item_singular} options in one line.`,

  // Error handling
  'try-except': (v) => `Handle errors when working with ${v.item_singular} data.`,
  'raising': (v) => `Signal problems with invalid ${v.item_singular} data.`,
  'finally': (v) => `Ensure ${v.item_singular} resources are cleaned up.`,

  // Functions
  'fn-basics': (v) => `Create reusable ${v.item_singular} operations.`,
  'lambda': (v) => `Define quick transformations for ${v.list_name}.`,
  'arguments': (v) => `Customize ${v.item_singular} processing with parameters.`,
  'defaults': (v) => `Provide fallback values for ${v.item_singular} parameters.`,

  // Comprehensions
  'list-comp': (v) => `Transform ${v.list_name} efficiently in one line.`,
  'dict-comp': (v) => `Build ${v.item_singular} lookups from data.`,
  'generator-exp': (v) => `Process ${v.list_name} lazily for efficiency.`,

  // OOP
  'classes': (v) => `Define ${v.entity_name || v.item_singular} structure as a class.`,
  'methods': (v) => `Add behavior to your ${v.entity_name || v.item_singular} class.`,
  'inheritance': (v) => `Extend ${v.entity_name || v.item_singular} with specialized variants.`,
  'dataclasses': (v) => `Define ${v.entity_name || v.item_singular} data concisely.`,
  'decorators': (v) => `Enhance ${v.item_singular} functions with wrappers.`,

  // File I/O
  'reading': (v) => `Load ${v.list_name} from a saved file.`,
  'writing': (v) => `Save ${v.list_name} to a file.`,
  'pathlib': (v) => `Manage file paths for ${v.item_singular} storage.`,
  'context': (v) => `Handle ${v.item_singular} resources safely.`,

  // Modules
  'imports': (v) => `Import utilities for ${v.item_singular} handling.`,

  // Strings
  'fstrings': (v) => `Format ${v.item_singular} data for display.`,
  'string-methods': (v) => `Process ${v.item_singular} text values.`,
  'slicing': (v) => `Extract portions of ${v.item_singular} data.`,
  'indexing': (v) => `Access specific ${v.item_singular} elements.`,

  // Numbers & Booleans
  'booleans': (v) => `Work with ${v.item_singular} true/false values.`,
  'comparisons': (v) => `Compare ${v.item_singular} values.`,
  'conversion': (v) => `Convert ${v.item_singular} data between types.`,
  'floats': (v) => `Handle decimal values in ${v.item_singular} calculations.`,
  'integers': (v) => `Work with whole numbers in ${v.item_singular} data.`,

  // Built-ins
  'sorted': (v) => `Sort ${v.list_name} in a specific order.`,
  'reversed': (v) => `Process ${v.list_name} in reverse.`,
  'zip': (v) => `Combine multiple ${v.item_singular} sequences.`,
  'any-all': (v) => `Check if ${v.list_name} items match a condition.`,
  'range': (v) => `Generate numbers for ${v.item_singular} iteration.`,
};

// Generate context based on skin domain and exercise
function generateContext(skinId: string, vars: SkinVars, exercise: Exercise): string {
  const { title } = exercise;

  // Try slug-specific templates first (most precise)
  for (const [pattern, template] of SLUG_TEMPLATES) {
    if (pattern.test(exercise.slug)) {
      return template(vars, title);
    }
  }

  // Try subconcept template
  const subconceptTemplate = SUBCONCEPT_TEMPLATES[exercise.subconcept];
  if (subconceptTemplate) {
    return subconceptTemplate(vars);
  }

  // Fall back to rephrasing the objective with domain terms
  let objective = exercise.objective;
  // Make it lowercase if it starts with a capital letter (unless it's an acronym)
  if (objective[0] === objective[0].toUpperCase() && objective[1] === objective[1].toLowerCase()) {
    objective = objective[0].toLowerCase() + objective.slice(1);
  }

  // Try to incorporate domain terms
  const domainContext = `${objective.replace(/\.?$/, '')} for ${vars.list_name}.`;

  // Ensure minimum length (20 chars per test requirement)
  if (domainContext.length < 20) {
    return `${vars.entity_name || vars.item_singular} ${objective.replace(/\.?$/, '')}.`;
  }

  return domainContext;
}

// Generate context for exercises that don't exist yet (using slug to infer)
function generateContextFromSlug(slug: string, vars: SkinVars): string {
  // Try slug-specific templates first
  for (const [pattern, template] of SLUG_TEMPLATES) {
    if (pattern.test(slug)) {
      return template(vars, slug);
    }
  }

  // Convert slug to readable title (e.g., "order-total-method" -> "order total method")
  const readableSlug = slug.replace(/-/g, ' ');

  // Infer domain-specific context from slug patterns
  const patterns: [RegExp, string][] = [
    [/order/, `Process ${vars.item_singular} order data.`],
    [/inventory/, `Manage ${vars.item_singular} inventory.`],
    [/customer/, `Handle ${vars.user_role || 'user'} data.`],
    [/product/, `Work with ${vars.entity_name || vars.item_singular} products.`],
    [/user/, `Manage ${vars.user_role || 'user'} accounts.`],
    [/event/, `Process ${vars.item_singular} events.`],
    [/log/, `Analyze ${vars.item_singular} logs.`],
    [/config/, `Handle ${vars.item_singular} configuration.`],
    [/parse/, `Parse ${vars.item_singular} data.`],
    [/validate/, `Validate ${vars.item_singular} input.`],
    [/filter/, `Filter ${vars.list_name} by criteria.`],
    [/sort/, `Sort ${vars.list_name} in order.`],
    [/export/, `Export ${vars.list_name} to file.`],
    [/import/, `Import ${vars.item_singular} data.`],
    [/dict/, `Use dictionary for ${vars.item_singular} lookup.`],
    [/list/, `Work with ${vars.list_name} collection.`],
    [/class/, `Define ${vars.entity_name || vars.item_singular} class.`],
    [/method/, `Add method to ${vars.entity_name || vars.item_singular}.`],
    [/decorator/, `Enhance ${vars.item_singular} functions.`],
    [/dataclass/, `Create ${vars.entity_name || vars.item_singular} data model.`],
    [/comp/, `Use comprehension for ${vars.list_name}.`],
    [/loop/, `Iterate through ${vars.list_name}.`],
    [/error/, `Handle ${vars.item_singular} errors gracefully.`],
    [/safe/, `Safely process ${vars.item_singular} data.`],
    [/check/, `Verify ${vars.item_singular} conditions.`],
    [/count/, `Count ${vars.item_plural} in ${vars.list_name}.`],
    [/total/, `Calculate ${vars.item_singular} totals.`],
    [/tier/, `Categorize ${vars.item_plural} by level.`],
    [/status/, `Track ${vars.item_singular} status.`],
    [/tag/, `Manage ${vars.item_singular} tags.`],
    [/guard/, `Guard against invalid ${vars.item_singular} data.`],
    [/retry/, `Retry failed ${vars.item_singular} operations.`],
    [/health/, `Check ${vars.item_singular} service health.`],
    [/api/, `Handle ${vars.item_singular} API requests.`],
    [/response/, `Process ${vars.item_singular} responses.`],
    [/integrated/, `Integrate ${vars.item_singular} functionality.`],
  ];

  for (const [pattern, context] of patterns) {
    if (pattern.test(slug)) {
      return context;
    }
  }

  // Generic fallback using the readable slug
  return `Apply ${readableSlug} to ${vars.list_name}.`;
}

// YAML stringify options to match original formatting
const YAML_OPTIONS = {
  lineWidth: 120,
  defaultKeyType: 'PLAIN' as const,
  defaultStringType: 'QUOTE_DOUBLE' as const,
};

async function main() {
  const exercises = await loadExercises();
  console.log(`Loaded ${exercises.size} exercises from YAML files`);

  const skinFiles = await readdir(SKINS_DIR);

  let totalUpdated = 0;
  let totalSkipped = 0;
  let filesModified = 0;

  // Pattern to detect placeholder text
  const PLACEHOLDER_PATTERN = /Use this step in the .* workflow/i;
  const MIN_CONTEXT_LENGTH = 20;

  for (const file of skinFiles.filter(f => f.endsWith('.yaml'))) {
    const filePath = join(SKINS_DIR, file);
    const content = await readFile(filePath, 'utf-8');
    const skin = parse(content) as Skin;

    let fileChanged = false;
    const updates: string[] = [];
    const skipped: string[] = [];

    for (const [slug, context] of Object.entries(skin.contexts)) {
      // Check if this is a placeholder OR too short
      const isPlaceholder = PLACEHOLDER_PATTERN.test(context);
      const isTooShort = context.length < MIN_CONTEXT_LENGTH;

      if (isPlaceholder || isTooShort) {
        const exercise = exercises.get(slug);
        let newContext: string;
        if (exercise) {
          newContext = generateContext(skin.id, skin.vars, exercise);
        } else {
          // Generate context from slug for exercises that don't exist yet
          newContext = generateContextFromSlug(slug, skin.vars);
          if (isPlaceholder) {
            totalSkipped++; // Still track these for reporting
            skipped.push(slug);
          }
        }

        // Ensure minimum length
        if (newContext.length < MIN_CONTEXT_LENGTH) {
          // Expand the context to meet minimum length
          const prefix = exercise
            ? `In this step, `
            : `For ${skin.vars.entity_name || skin.vars.item_singular}, `;
          newContext = prefix + newContext.charAt(0).toLowerCase() + newContext.slice(1);
        }

        // Only update if context actually changed
        if (newContext !== context) {
          skin.contexts[slug] = newContext;
          fileChanged = true;
          totalUpdated++;
          const reason = isPlaceholder ? 'placeholder' : 'too short';
          updates.push(`  ${slug} (${reason}): "${newContext}"`);
        }
      }
    }

    if (fileChanged) {
      // Preserve the original YAML structure and formatting
      const newContent = stringify(skin, YAML_OPTIONS);
      await writeFile(filePath, newContent, 'utf-8');
      filesModified++;
      console.log(`\n${file}: Updated ${updates.length} contexts`);
      if (updates.length <= 10) {
        updates.forEach(u => console.log(u));
      } else {
        updates.slice(0, 5).forEach(u => console.log(u));
        console.log(`  ... and ${updates.length - 5} more`);
      }
      if (skipped.length > 0) {
        console.log(`  Skipped (exercise not found): ${skipped.join(', ')}`);
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Summary:`);
  console.log(`  Files modified: ${filesModified}`);
  console.log(`  Contexts updated: ${totalUpdated}`);
  console.log(`  Skipped (exercise not found): ${totalSkipped}`);

  if (totalSkipped > 0) {
    console.log(`\nNote: Some exercise slugs in skin contexts don't exist in YAML files.`);
    console.log(`These may be planned exercises or need to be removed from skins.`);
  }
}

main().catch(console.error);
