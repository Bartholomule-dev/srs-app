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
  /** Allow additional custom variables */
  [key: string]: string | string[];
}

/**
 * Skin: Domain theming for exercises
 *
 * Provides themed variable values and contextual explanations
 * that make exercises feel like building a real application.
 */
export interface Skin {
  id: string;
  title: string;
  /** Emoji icon for display */
  icon: string;
  /** Which blueprints this skin is compatible with */
  blueprints: string[];
  /** Variable values for Mustache templating */
  vars: SkinVars;
  /** Exercise-specific context text (keyed by exercise slug) */
  contexts: Record<string, string>;
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
}
