// src/lib/exercise/telemetry.ts
import type { GradingStrategy } from './types';

export interface GradingTelemetry {
  exerciseSlug: string;
  strategy: GradingStrategy;
  wasCorrect: boolean;
  fallbackUsed: boolean;
  fallbackReason?: string;
  matchedAlternative?: string | null;
  userAnswerHash: string;
  timestamp: Date;
}

export interface CreateTelemetryParams {
  exerciseSlug: string;
  strategy: GradingStrategy;
  wasCorrect: boolean;
  fallbackUsed: boolean;
  fallbackReason?: string;
  matchedAlternative?: string | null;
  userAnswer: string;
}

/**
 * Create a telemetry entry, hashing the user answer for privacy.
 */
export function createTelemetryEntry(params: CreateTelemetryParams): GradingTelemetry {
  return {
    exerciseSlug: params.exerciseSlug,
    strategy: params.strategy,
    wasCorrect: params.wasCorrect,
    fallbackUsed: params.fallbackUsed,
    fallbackReason: params.fallbackReason,
    matchedAlternative: params.matchedAlternative,
    userAnswerHash: hashString(params.userAnswer),
    timestamp: new Date(),
  };
}

/**
 * Log grading telemetry. Currently console-only; future: analytics.
 */
export function logGradingTelemetry(telemetry: GradingTelemetry): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Grading]', telemetry);
  }
  // Future: send to analytics endpoint
}

/**
 * Simple hash for privacy. Not cryptographically secure, just for anonymization.
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
