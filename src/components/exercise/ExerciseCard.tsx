'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Exercise, Quality } from '@/lib/types';
import { checkAnswerWithAlternatives, checkFillInAnswer, inferQuality, type QualityInputs } from '@/lib/exercise';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CodeInput } from './CodeInput';
import { FillInExercise } from './FillInExercise';
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
  const [prevExerciseId, setPrevExerciseId] = useState(exercise.id);

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
    setAnswerResult(null);
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

  const handleSubmit = useCallback(() => {
    const result = checkAnswerWithAlternatives(
      userAnswer,
      exercise.expectedAnswer,
      exercise.acceptedSolutions
    );
    setAnswerResult({ isCorrect: result.isCorrect, usedAstMatch: result.usedAstMatch });
    setPhase('feedback');
  }, [userAnswer, exercise.expectedAnswer, exercise.acceptedSolutions]);

  const handleGiveUp = useCallback(() => {
    setAnswerResult({ isCorrect: false, usedAstMatch: false });
    setPhase('feedback');
  }, []);

  const handleFillInSubmit = useCallback((answer: string) => {
    // Start timer if not already started
    if (startTime === null) {
      setStartTime(Date.now());
    }

    const isCorrect = checkFillInAnswer(
      answer,
      exercise.expectedAnswer,
      exercise.acceptedSolutions
    );

    setUserAnswer(answer);
    setAnswerResult({ isCorrect, usedAstMatch: false });
    setPhase('feedback');
  }, [exercise.expectedAnswer, exercise.acceptedSolutions, startTime]);

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
              />

              {exercise.exerciseType === 'fill-in' && exercise.template ? (
                <FillInExercise
                  template={exercise.template}
                  blankPosition={exercise.blankPosition ?? 0}
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
                  >
                    Give Up
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSubmit}
                  >
                    Submit
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
                isCorrect={answerResult?.isCorrect ?? false}
                userAnswer={userAnswer}
                expectedAnswer={exercise.expectedAnswer}
                nextReviewDays={nextReviewDays}
                onContinue={handleContinue}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
