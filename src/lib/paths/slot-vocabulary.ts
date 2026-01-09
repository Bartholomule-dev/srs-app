/**
 * Standardized slot vocabulary for skin-driven exercise templating.
 *
 * IMPORTANT: Variable names match the EXISTING SkinVars interface.
 * We keep `list_name` (not `collection_var`) because exercises are
 * rendered before skins are selected, so we must use names that
 * existing skins already provide.
 *
 * These 12 slots cover ~80% of all exercise variable needs.
 */

/**
 * The 12 standard slots that skins can provide for exercise templating.
 */
export interface SlotVocabulary {
  /** Main collection variable name - KEEP EXISTING NAME */
  list_name: string;
  /** Singular item name (item, task, song, product) */
  item_singular: string;
  /** Plural item name (items, tasks, songs, products) */
  item_plural: string;
  /** Primary attribute key (name, title, track) */
  attr_key_1: string;
  /** Secondary attribute key (price, duration, priority) */
  attr_key_2: string;
  /** ID variable name (id, sku, track_id, task_id) */
  id_var: string;
  /** Filename for file exercises (data.txt, inventory.json) */
  filename: string;
  /** File type/extension (txt, json, csv) */
  filetype: string;
  /** User role for examples (admin, guest, user) */
  user_role: string;
  /** Status variable (active, done, playing) */
  status_var: string;
  /** Action verb (add, remove, update, play) */
  action_verb: string;
  /** Entity name for OOP/classes (Task, Item, Song) */
  entity_name: string;
}

/** Slot definition with description and examples */
export interface SlotDefinition {
  description: string;
  examples: string[];
}

/** Standard slot definitions with descriptions */
export const STANDARD_SLOTS: Record<keyof SlotVocabulary, SlotDefinition> = {
  list_name: {
    description: 'Main collection variable name (matches existing SkinVars)',
    examples: ['items', 'tasks', 'playlist', 'cart', 'inventory'],
  },
  item_singular: {
    description: 'Singular form of item',
    examples: ['item', 'task', 'song', 'product', 'weapon'],
  },
  item_plural: {
    description: 'Plural form of item',
    examples: ['items', 'tasks', 'songs', 'products', 'weapons'],
  },
  attr_key_1: {
    description: 'Primary attribute/dict key',
    examples: ['name', 'title', 'track', 'product_name'],
  },
  attr_key_2: {
    description: 'Secondary attribute/dict key',
    examples: ['price', 'duration', 'priority', 'quantity'],
  },
  id_var: {
    description: 'ID variable name',
    examples: ['id', 'task_id', 'track_id', 'sku'],
  },
  filename: {
    description: 'Filename for file I/O exercises',
    examples: ['data.txt', 'tasks.json', 'inventory.json'],
  },
  filetype: {
    description: 'File extension/type',
    examples: ['txt', 'json', 'csv'],
  },
  user_role: {
    description: 'User role for examples',
    examples: ['admin', 'guest', 'user', 'player'],
  },
  status_var: {
    description: 'Status variable name',
    examples: ['active', 'done', 'playing', 'pending'],
  },
  action_verb: {
    description: 'Primary action verb',
    examples: ['add', 'remove', 'update', 'play', 'buy'],
  },
  entity_name: {
    description: 'Entity/class name (PascalCase)',
    examples: ['Task', 'Item', 'Song', 'Product'],
  },
};

/**
 * Required slots that every skin must provide (matches existing SkinVars).
 * These are the 5 fields already required by the current SkinVars interface.
 */
export const REQUIRED_SLOTS = [
  'list_name', // Existing required field
  'item_singular', // Existing required field
  'item_plural', // Existing required field
  'item_examples', // Existing required field (array)
  'record_keys', // Existing required field (array)
] as const;

export type RequiredSlot = (typeof REQUIRED_SLOTS)[number];

/** Validation result for skin vars */
export interface SkinVarsValidationResult {
  valid: boolean;
  missing: string[];
}

/**
 * Validate skin vars have minimum required slots.
 *
 * @param vars - The skin vars object to validate
 * @returns Validation result with valid flag and list of missing slots
 */
export function validateSkinVarsHasRequiredSlots(
  vars: Record<string, unknown>
): SkinVarsValidationResult {
  const missing = REQUIRED_SLOTS.filter((slot) => !(slot in vars));
  return { valid: missing.length === 0, missing };
}
