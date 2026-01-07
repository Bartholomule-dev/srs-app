// src/lib/generators/render.ts
// Template rendering pipeline for parameterized exercises

import Mustache from 'mustache';
import { createSeed } from './seed';
import { getGenerator } from './index';
import type { RenderedExerciseMetadata } from './types';

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

  // Render all template fields
  const rendered: RenderedExercise<T> = {
    ...exercise,
    prompt: Mustache.render(exercise.prompt, params),
    expectedAnswer: Mustache.render(exercise.expectedAnswer, params),
    acceptedSolutions: exercise.acceptedSolutions.map((s) =>
      Mustache.render(s, params)
    ),
    _generatedParams: params,
    _seed: seed,
  };

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
 * Batch render multiple exercises for a session.
 */
export function renderExercises<T extends RenderableExercise>(
  exercises: T[],
  userId: string,
  dueDate: Date
): RenderedExercise<T>[] {
  return exercises.map((e) => renderExercise(e, userId, dueDate));
}
