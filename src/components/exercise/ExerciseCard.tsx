'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Exercise, Quality } from '@/lib/types';
import { checkAnswer, inferQuality, type QualityInputs } from '@/lib/exercise';
import { CodeInput } from './CodeInput';
import { ExercisePrompt } from './ExercisePrompt';
import { HintButton } from './HintButton';
import { ExerciseFeedback } from './ExerciseFeedback';

type Phase = 'answering' | 'feedback';

interface ExerciseCardProps {
  exercise: Exercise;
  onComplete: (exerciseId: string, quality: Quality) => void;
}

export function ExerciseCard({ exercise, onComplete }: ExerciseCardProps) {
  const [phase, setPhase] = useState<Phase>('answering');
  const [userAnswer, setUserAnswer] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedMs, setPausedMs] = useState(0);
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; usedAstMatch: boolean } | null>(null);

  const pauseStartRef = useRef<number | null>(null);

  // Track page visibility for pausing timer
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && startTime !== null) {
        pauseStartRef.current = Date.now();
      } else if (!document.hidden && pauseStartRef.current !== null) {
        setPausedMs((prev) => prev + (Date.now() - pauseStartRef.current!));
        pauseStartRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [startTime]);

  const handleInputChange = useCallback((value: string) => {
    if (startTime === null && value.length > 0) {
      setStartTime(Date.now());
    }
    setUserAnswer(value);
  }, [startTime]);

  const handleHintReveal = useCallback(() => {
    setHintUsed(true);
  }, []);

  const handleSubmit = useCallback(() => {
    const result = checkAnswer(userAnswer, exercise.expectedAnswer);
    setAnswerResult({ isCorrect: result.isCorrect, usedAstMatch: result.usedAstMatch });
    setPhase('feedback');
  }, [userAnswer, exercise.expectedAnswer]);

  const handleGiveUp = useCallback(() => {
    setAnswerResult({ isCorrect: false, usedAstMatch: false });
    setPhase('feedback');
  }, []);

  const handleContinue = useCallback(() => {
    const responseTimeMs = startTime !== null ? Date.now() - startTime - pausedMs : 0;

    const inputs: QualityInputs = {
      isCorrect: answerResult?.isCorrect ?? false,
      hintUsed,
      responseTimeMs,
      usedAstMatch: answerResult?.usedAstMatch ?? false,
    };

    const quality = inferQuality(inputs);
    onComplete(exercise.id, quality);
  }, [exercise.id, startTime, pausedMs, hintUsed, answerResult, onComplete]);

  // Calculate next review days (rough estimate based on current state)
  const nextReviewDays = answerResult?.isCorrect ? 6 : 1;

  const firstHint = exercise.hints[0] ?? '';

  if (phase === 'answering') {
    return (
      <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
        <ExercisePrompt
          category={exercise.category}
          language={exercise.language}
          prompt={exercise.prompt}
        />

        <CodeInput
          value={userAnswer}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
        />

        <div className="flex items-start justify-between gap-4">
          {firstHint && (
            <HintButton
              hint={firstHint}
              revealed={hintUsed}
              onReveal={handleHintReveal}
            />
          )}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={handleGiveUp}
              className="px-4 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Give Up
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              Submit ↵
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
      <ExerciseFeedback
        isCorrect={answerResult?.isCorrect ?? false}
        userAnswer={userAnswer}
        expectedAnswer={exercise.expectedAnswer}
        nextReviewDays={nextReviewDays}
        onContinue={handleContinue}
      />
    </div>
  );
}
