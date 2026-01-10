/**
 * Path system types for Blueprint + Skin presentation layer.
 *
 * Three-layer architecture:
 * - Exercise: Atomic FSRS-scheduled skill unit
 * - Blueprint: Ordered sequence defining a "build something" narrative
 * - Skin: Domain theming (variable names, context text)
 */

/**
 * A step in a blueprint sequence
 */
export interface Beat {
  /** 1-indexed position in the blueprint */
  beat: number;
  /** Exercise slug to practice at this beat */
  exercise: string;
  /** Human-readable title for this step */
  title: string;
  /** Optional exercise slugs for side-quests (bonus exercises for this beat) */
  sideQuests?: string[];
}

/**
 * Blueprint: An ordered sequence of exercises forming a narrative
 *
 * Example: "Build a CLI Collection App" with 8 beats
 */
export interface Blueprint {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Concepts covered by this blueprint */
  concepts: string[];
  /** Ordered sequence of exercises */
  beats: Beat[];
}

/**
 * Variable values provided by a skin for Mustache templating
 */
export interface SkinVars {
  /** Variable name for the main collection (e.g., "tasks", "cart", "playlist") */
  list_name: string;
  /** Singular form of item (e.g., "task", "item", "song") */
  item_singular: string;
  /** Plural form of item */
  item_plural: string;
  /** Example item values for exercises */
  item_examples: string[];
  /** Keys for dict/record exercises */
  record_keys: string[];

  // Extended optional slots for broader exercise coverage
  /** First attribute key (e.g., "power", "price") */
  attr_key_1?: string;
  /** Second attribute key (e.g., "rarity", "quantity") */
  attr_key_2?: string;
  /** ID variable name (e.g., "item_id", "task_id") */
  id_var?: string;
  /** Filename for file I/O exercises */
  filename?: string;
  /** File type (e.g., "json", "csv", "txt") */
  filetype?: string;
  /** User role in the domain (e.g., "player", "admin", "user") */
  user_role?: string;
  /** Status variable name (e.g., "equipped", "completed", "active") */
  status_var?: string;
  /** Action verb for the domain (e.g., "equip", "complete", "add") */
  action_verb?: string;
  /** Entity name for OOP exercises (e.g., "Equipment", "Task", "Product") */
  entity_name?: string;

  /** Allow additional custom variables */
  [key: string]: string | string[] | undefined;
}

/**
 * Primitive value types for skin data packs.
 */
export type SkinPrimitiveValue = string | number | boolean;

/**
 * Value types for skin data packs.
 * Allows nested objects for complex domain data (e.g., API responses).
 */
export type SkinDataValue =
  | SkinPrimitiveValue
  | SkinPrimitiveValue[]
  | Record<string, SkinPrimitiveValue>
  | Record<string, SkinPrimitiveValue | Record<string, SkinPrimitiveValue>>;

/**
 * Data pack for predict exercises - provides themed sample data
 * that varies based on the skin domain.
 */
export interface SkinDataPack {
  /** Sample list values for list exercises */
  list_sample: (string | number | boolean)[];
  /** Sample dictionary for dict exercises - allows one level of nesting */
  dict_sample: Record<string, SkinPrimitiveValue | Record<string, SkinPrimitiveValue>>;
  /** Sample records array for iteration exercises */
  records_sample: Record<string, SkinPrimitiveValue | Record<string, SkinPrimitiveValue>>[];
  /** Sample string messages for output exercises */
  string_samples: string[];
}

/**
 * Skin: Domain theming for exercises
 *
 * Provides themed variable values and contextual explanations
 * that make exercises feel like building a real application.
 *
 * Skins can be global (compatible with any blueprint) or restricted
 * to specific blueprints via the optional `blueprints` array.
 */
export interface Skin {
  id: string;
  title: string;
  /** Emoji icon for display */
  icon: string;
  /** Which blueprints this skin is compatible with (omit for global skins) */
  blueprints?: string[];
  /** Variable values for Mustache templating */
  vars: SkinVars;
  /** Exercise-specific context text (keyed by exercise slug) */
  contexts: Record<string, string>;
  /** Optional data pack for predict exercises */
  dataPack?: SkinDataPack;
}

/**
 * Reference to a blueprint with beat info
 */
export interface BlueprintRef {
  blueprintId: string;
  beat: number;
  totalBeats: number;
  beatTitle: string;
}

/**
 * Index structure for efficient lookups
 */
export interface PathIndex {
  /** Blueprint ID -> Blueprint */
  blueprints: Map<string, Blueprint>;
  /** Skin ID -> Skin */
  skins: Map<string, Skin>;
  /** Exercise slug -> BlueprintRefs (which blueprints contain this exercise) */
  exerciseToBlueprints: Map<string, BlueprintRef[]>;
  /** Exercise slug -> Skin IDs (which skins support this exercise) */
  exerciseToSkins: Map<string, string[]>;
}

/**
 * Session card extended with skin/blueprint context
 */
export interface SkinnedCard {
  /** The exercise to practice */
  exerciseSlug: string;
  /** Active skin ID (null if no skin applied) */
  skinId: string | null;
  /** Active blueprint ID (null if not part of blueprint) */
  blueprintId: string | null;
  /** Current beat in blueprint (null if not part of blueprint) */
  beat: number | null;
  /** Total beats in blueprint */
  totalBeats: number | null;
  /** Title of current beat */
  beatTitle: string | null;
  /** Context text from skin for this exercise */
  context: string | null;
  /** True if this is a side-quest exercise, not the main beat */
  isSideQuest: boolean;
}
