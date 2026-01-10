// src/lib/generators/render.ts
// Template rendering pipeline for parameterized exercises

import Mustache from 'mustache';
import { createSeed, hashString } from './seed';
import { getGenerator } from './index';
import type { RenderedExerciseMetadata, VariantMap } from './types';
import type { Skin, SkinVars, SkinDataPack } from '@/lib/paths/types';

// Disable Mustache's HTML escaping (we're not rendering to HTML)
Mustache.escape = (text: string) => text;

/**
 * Derive additional variables from skin vars.
 * - item_example: Random element from item_examples (deterministic per exercise)
 *
 * @param skinVars - Original skin variables
 * @param exerciseSlug - Exercise slug for deterministic selection
 * @returns Extended skin variables with derived values
 */
function deriveSkinVars(
  skinVars: SkinVars,
  exerciseSlug: string
): SkinVars & { item_example?: string } {
  const derived: SkinVars & { item_example?: string } = { ...skinVars };

  // Derive item_example from item_examples array
  if (skinVars.item_examples && skinVars.item_examples.length > 0) {
    // Use first 8 chars of hash as a number for deterministic index
    const hash = hashString(exerciseSlug);
    const hashNum = parseInt(hash.slice(0, 8), 16);
    const index = hashNum % skinVars.item_examples.length;
    derived.item_example = skinVars.item_examples[index];
  }

  return derived;
}

/**
 * Minimum exercise interface required for rendering.
 * This allows renderExercise to work with both full Exercise objects
 * and partial test fixtures.
 */
export interface RenderableExercise {
  slug: string;
  prompt: string;
  expectedAnswer: string;
  acceptedSolutions: string[];
  generator?: string | null;
  code?: string | null;
  template?: string | null;
  hints?: string[];
  variants?: VariantMap;
  verificationScript?: string | null;
}

/**
 * Rendered exercise with original fields plus generator metadata.
 */
export type RenderedExercise<T extends RenderableExercise> = T & RenderedExerciseMetadata;

/**
 * Helper to render all template fields of an exercise with given params.
 */
function renderWithParams<T extends RenderableExercise>(
  exercise: T,
  params: Record<string, unknown>
): RenderedExercise<T> {
  const rendered: RenderedExercise<T> = {
    ...exercise,
    prompt: Mustache.render(exercise.prompt, params),
    expectedAnswer: Mustache.render(exercise.expectedAnswer, params),
    acceptedSolutions: exercise.acceptedSolutions.map((s) => Mustache.render(s, params)),
  };

  // Render hints through Mustache if present
  if (exercise.hints) {
    rendered.hints = exercise.hints.map((h) => Mustache.render(h, params));
  }

  // Render optional fields if present
  if (exercise.code) {
    rendered.code = Mustache.render(exercise.code, params);
  }
  if (exercise.template) {
    rendered.template = Mustache.render(exercise.template, params);
  }
  if (exercise.verificationScript) {
    rendered.verificationScript = Mustache.render(exercise.verificationScript, params);
  }

  return rendered;
}

/**
 * Render a parameterized exercise by interpolating templates.
 *
 * Static exercises (no generator field) pass through unchanged unless skinVars/dataPack provided.
 * Dynamic exercises have their templates rendered with generated params.
 * When skinVars are provided, they are merged with generator params (generator takes precedence).
 * When skinDataPack is provided, its values are available for predict exercises.
 *
 * @param exercise - Exercise to render (may have generator field)
 * @param userId - User ID for seed generation
 * @param dueDate - Due date for seed generation
 * @param skinVars - Optional skin variables for Mustache templating
 * @param skinDataPack - Optional data pack for predict exercises (sample data)
 * @returns Exercise with rendered templates and metadata
 */
export function renderExercise<T extends RenderableExercise>(
  exercise: T,
  userId: string,
  dueDate: Date,
  skinVars?: SkinVars,
  skinDataPack?: SkinDataPack
): RenderedExercise<T> {
  // Derive additional skin vars (like item_example from item_examples)
  const derivedSkinVars = skinVars ? deriveSkinVars(skinVars, exercise.slug) : undefined;

  // Merge skin vars with data pack (skinVars take precedence over dataPack)
  const skinContext = skinDataPack
    ? { ...skinDataPack, ...derivedSkinVars }
    : derivedSkinVars;

  // Static exercises with no skinContext pass through unchanged
  if (!exercise.generator && !skinContext) {
    return exercise as RenderedExercise<T>;
  }

  // If only skinContext (no generator), render with skin variables/data pack
  if (!exercise.generator && skinContext) {
    return renderWithParams(exercise, skinContext);
  }

  // Look up generator (we know exercise.generator exists at this point)
  const generator = getGenerator(exercise.generator!);
  if (!generator) {
    console.warn(`Unknown generator: ${exercise.generator} for exercise ${exercise.slug}`);
    return exercise as RenderedExercise<T>;
  }

  // Generate parameters from seed
  const seed = createSeed(userId, exercise.slug, dueDate);
  const generatorParams = generator.generate(seed);
  // Merge dataPack -> skinVars -> generator params (generator takes precedence)
  const params = skinContext ? { ...skinContext, ...generatorParams } : generatorParams;

  // Check if generator returned a variant selection
  const variantName = typeof params.variant === 'string' ? params.variant : undefined;
  const variantOverrides =
    variantName && exercise.variants?.[variantName]
      ? exercise.variants[variantName]
      : undefined;

  // Determine which fields to use (variant overrides or base)
  const promptToRender = variantOverrides?.prompt ?? exercise.prompt;
  const expectedAnswerToRender = variantOverrides?.expectedAnswer ?? exercise.expectedAnswer;
  const acceptedToRender = variantOverrides?.acceptedSolutions ?? exercise.acceptedSolutions;
  const hintsToRender = variantOverrides?.hints ?? exercise.hints;
  const codeToRender = variantOverrides?.code ?? exercise.code;
  const templateToRender = variantOverrides?.template ?? exercise.template;
  const verificationScriptToRender = exercise.verificationScript;

  // Render all template fields
  const rendered: RenderedExercise<T> = {
    ...exercise,
    prompt: Mustache.render(promptToRender, params),
    expectedAnswer: Mustache.render(expectedAnswerToRender, params),
    acceptedSolutions: acceptedToRender.map((s) => Mustache.render(s, params)),
    _generatedParams: params,
    _seed: seed,
  };

  // Render hints through Mustache if present
  if (hintsToRender) {
    rendered.hints = hintsToRender.map((h) => Mustache.render(h, params));
  }

  // Render optional fields if present
  if (codeToRender) {
    rendered.code = Mustache.render(codeToRender, params);
  }
  if (templateToRender) {
    rendered.template = Mustache.render(templateToRender, params);
  }
  if (verificationScriptToRender) {
    rendered.verificationScript = Mustache.render(verificationScriptToRender, params);
  }

  return rendered;
}

/**
 * Batch render multiple exercises with optional per-exercise skins.
 *
 * @param exercises - Array of exercises to render
 * @param userId - User ID for seed generation
 * @param dueDate - Due date for seed generation
 * @param skins - Optional array of skins (or null) corresponding to each exercise
 * @returns Array of rendered exercises with templates filled in
 */
export function renderExercises<T extends RenderableExercise>(
  exercises: T[],
  userId: string,
  dueDate: Date,
  skins?: (Skin | null)[]
): RenderedExercise<T>[] {
  return exercises.map((exercise, i) => {
    const skin = skins?.[i];
    return renderExercise(exercise, userId, dueDate, skin?.vars, skin?.dataPack);
  });
}
