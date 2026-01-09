// src/lib/generators/render.ts
// Template rendering pipeline for parameterized exercises

import Mustache from 'mustache';
import { createSeed } from './seed';
import { getGenerator } from './index';
import type { RenderedExerciseMetadata, VariantMap } from './types';
import type { SkinVars } from '@/lib/paths/types';

// Disable Mustache's HTML escaping (we're not rendering to HTML)
Mustache.escape = (text: string) => text;

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

  return rendered;
}

/**
 * Render a parameterized exercise by interpolating templates.
 *
 * Static exercises (no generator field) pass through unchanged unless skinVars provided.
 * Dynamic exercises have their templates rendered with generated params.
 * When skinVars are provided, they are merged with generator params (generator takes precedence).
 *
 * @param exercise - Exercise to render (may have generator field)
 * @param userId - User ID for seed generation
 * @param dueDate - Due date for seed generation
 * @param skinVars - Optional skin variables for Mustache templating
 * @returns Exercise with rendered templates and metadata
 */
export function renderExercise<T extends RenderableExercise>(
  exercise: T,
  userId: string,
  dueDate: Date,
  skinVars?: SkinVars
): RenderedExercise<T> {
  // Static exercises with no skinVars pass through unchanged
  if (!exercise.generator && !skinVars) {
    return exercise as RenderedExercise<T>;
  }

  // If only skinVars (no generator), render with skin variables
  if (!exercise.generator && skinVars) {
    return renderWithParams(exercise, skinVars);
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
  // Merge skinVars with generator params (generator takes precedence)
  const params = skinVars ? { ...skinVars, ...generatorParams } : generatorParams;

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

  return rendered;
}

/**
 * Batch render multiple exercises for a session.
 */
export function renderExercises<T extends RenderableExercise>(
  exercises: T[],
  userId: string,
  dueDate: Date,
  skinVars?: SkinVars
): RenderedExercise<T>[] {
  return exercises.map((e) => renderExercise(e, userId, dueDate, skinVars));
}
