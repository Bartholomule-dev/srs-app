// src/lib/generators/render.ts
// Template rendering pipeline for parameterized exercises

import Mustache from 'mustache';
import { createSeed } from './seed';
import { getGenerator } from './index';
import type { RenderedExerciseMetadata, VariantMap } from './types';

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
 * Render a parameterized exercise by interpolating templates.
 *
 * Static exercises (no generator field) pass through unchanged.
 * Dynamic exercises have their templates rendered with generated params.
 *
 * @param exercise - Exercise to render (may have generator field)
 * @param userId - User ID for seed generation
 * @param dueDate - Due date for seed generation
 * @returns Exercise with rendered templates and metadata
 */
export function renderExercise<T extends RenderableExercise>(
  exercise: T,
  userId: string,
  dueDate: Date
): RenderedExercise<T> {
  // Static exercises pass through unchanged
  if (!exercise.generator) {
    return exercise as RenderedExercise<T>;
  }

  // Look up generator
  const generator = getGenerator(exercise.generator);
  if (!generator) {
    console.warn(`Unknown generator: ${exercise.generator} for exercise ${exercise.slug}`);
    return exercise as RenderedExercise<T>;
  }

  // Generate parameters from seed
  const seed = createSeed(userId, exercise.slug, dueDate);
  const params = generator.generate(seed);

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
  dueDate: Date
): RenderedExercise<T>[] {
  return exercises.map((e) => renderExercise(e, userId, dueDate));
}
