'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Exercise, Quality } from '@/lib/types';
import { gradeAnswerAsync, type GradingResult, inferQuality, type QualityInputs } from '@/lib/exercise';
import { usePyodide } from '@/lib/context/PyodideContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CodeInput } from './CodeInput';
import { FillInExercise } from './FillInExercise';
import { PredictOutputExercise } from './PredictOutputExercise';
import { ExercisePrompt } from './ExercisePrompt';
import { HintButton } from './HintButton';
import { ExerciseFeedback } from './ExerciseFeedback';

type Phase = 'answering' | 'feedback';

interface ExerciseCardProps {
  exercise: Exercise;
  onComplete: (quality: Quality) => void;
}

export function ExerciseCard({ exercise, onComplete }: ExerciseCardProps) {
  const { pyodide, loading: pyodideLoading } = usePyodide();

  const [phase, setPhase] = useState<Phase>('answering');
  const [userAnswer, setUserAnswer] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedMs, setPausedMs] = useState(0);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [prevExerciseId, setPrevExerciseId] = useState(exercise.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pauseStartRef = useRef<number | null>(null);
  const prevIdForRef = useRef(exercise.id);

  // Reset state when exercise changes (critical for sequential questions)
  // Using the "adjusting state based on props" pattern recommended by React docs
  // instead of useEffect to avoid cascading renders
  if (exercise.id !== prevExerciseId) {
    setPrevExerciseId(exercise.id);
    setPhase('answering');
    setUserAnswer('');
    setHintUsed(false);
    setStartTime(null);
    setPausedMs(0);
    setGradingResult(null);
    setIsSubmitting(false);
  }

  // Reset pause timer ref when exercise changes
  // This runs after render, which is when refs should be updated
  useEffect(() => {
    if (prevIdForRef.current !== exercise.id) {
      pauseStartRef.current = null;
      prevIdForRef.current = exercise.id;
    }
  }, [exercise.id]);

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

  // Core async grading function - all submit handlers use this
  const performGrading = useCallback(async (answer: string) => {
    setIsSubmitting(true);
    try {
      const result = await gradeAnswerAsync(answer, exercise, pyodide);
      setGradingResult(result);
      setPhase('feedback');
    } finally {
      setIsSubmitting(false);
    }
  }, [exercise, pyodide]);

  const handleSubmit = useCallback(async () => {
    await performGrading(userAnswer);
  }, [userAnswer, performGrading]);

  const handleGiveUp = useCallback(async () => {
    // Create a "give up" grading result - user didn't attempt an answer
    await performGrading('');
  }, [performGrading]);

  const handleFillInSubmit = useCallback(async (answer: string) => {
    // Start timer if not already started
    if (startTime === null) {
      setStartTime(Date.now());
    }

    setUserAnswer(answer);
    await performGrading(answer);
  }, [startTime, performGrading]);

  const handlePredictSubmit = useCallback(async (answer: string) => {
    if (startTime === null) setStartTime(Date.now());
    setUserAnswer(answer);
    await performGrading(answer);
  }, [startTime, performGrading]);

  // Unified submit handler that routes to correct checker based on exercise type
  const handleButtonSubmit = useCallback(async () => {
    if (exercise.exerciseType === 'predict') {
      await handlePredictSubmit(userAnswer);
    } else if (exercise.exerciseType === 'fill-in') {
      await handleFillInSubmit(userAnswer);
    } else {
      await handleSubmit();
    }
  }, [exercise.exerciseType, userAnswer, handlePredictSubmit, handleFillInSubmit, handleSubmit]);

  const handleContinue = useCallback(() => {
    const responseTimeMs = startTime !== null ? Date.now() - startTime - pausedMs : 0;

    const inputs: QualityInputs = {
      isCorrect: gradingResult?.isCorrect ?? false,
      hintUsed,
      responseTimeMs,
      usedAstMatch: false, // GradingResult uses gradingMethod instead
    };

    const quality = inferQuality(inputs);
    onComplete(quality);
  }, [startTime, pausedMs, hintUsed, gradingResult, onComplete]);

  // Calculate next review days (rough estimate based on current state)
  const nextReviewDays = gradingResult?.isCorrect ? 6 : 1;

  const firstHint = exercise.hints[0] ?? '';

  return (
    <Card className="overflow-hidden">
      {/* Category indicator bar */}
      <div className="h-1 bg-gradient-to-r from-[var(--accent-primary)] to-orange-500" />

      <CardContent className="p-6">
        <AnimatePresence mode="wait">
          {phase === 'answering' ? (
            <motion.div
              key="answering"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <ExercisePrompt
                category={exercise.category}
                language={exercise.language}
                prompt={exercise.prompt}
                exerciseType={exercise.exerciseType}
              />

              {/* Pyodide loading indicator for predict exercises */}
              {exercise.exerciseType === 'predict' && pyodideLoading && (
                <div className="text-sm text-text-secondary flex items-center gap-2 mb-4">
                  <span className="animate-spin">&#8635;</span>
                  Loading Python runtime...
                </div>
              )}

              {exercise.exerciseType === 'predict' && exercise.code ? (
                <PredictOutputExercise
                  code={exercise.code}
                  value={userAnswer}
                  onChange={handleInputChange}
                  onSubmit={handlePredictSubmit}
                  disabled={phase !== 'answering'}
                />
              ) : exercise.exerciseType === 'fill-in' && exercise.template ? (
                <FillInExercise
                  template={exercise.template}
                  blankPosition={exercise.blankPosition ?? 0}
                  value={userAnswer}
                  onChange={handleInputChange}
                  onSubmit={handleFillInSubmit}
                  disabled={phase !== 'answering'}
                />
              ) : (
                <CodeInput
                  value={userAnswer}
                  onChange={handleInputChange}
                  onSubmit={handleSubmit}
                />
              )}

              <div className="flex items-start justify-between gap-4">
                {firstHint && (
                  <HintButton
                    hint={firstHint}
                    revealed={hintUsed}
                    onReveal={handleHintReveal}
                  />
                )}
                <div className="flex gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleGiveUp}
                    disabled={isSubmitting}
                  >
                    Give Up
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleButtonSubmit}
                    disabled={isSubmitting || (pyodideLoading && (exercise.exerciseType === 'predict' || exercise.verifyByExecution))}
                  >
                    {isSubmitting ? 'Checking...' : 'Submit'}
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ExerciseFeedback
                isCorrect={gradingResult?.isCorrect ?? false}
                userAnswer={userAnswer}
                expectedAnswer={exercise.expectedAnswer}
                nextReviewDays={nextReviewDays}
                onContinue={handleContinue}
                coachingFeedback={gradingResult?.coachingFeedback}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
