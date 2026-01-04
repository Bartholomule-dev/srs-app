'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Exercise, Quality } from '@/lib/types';
import { checkAnswer, inferQuality, type QualityInputs } from '@/lib/exercise';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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

  // Reset state when exercise changes (critical for sequential questions)
  useEffect(() => {
    setPhase('answering');
    setUserAnswer('');
    setHintUsed(false);
    setStartTime(null);
    setPausedMs(0);
    setAnswerResult(null);
    pauseStartRef.current = null;
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
      <Card>
        <CardContent className="p-6 space-y-6">
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <ExerciseFeedback
          isCorrect={answerResult?.isCorrect ?? false}
          userAnswer={userAnswer}
          expectedAnswer={exercise.expectedAnswer}
          nextReviewDays={nextReviewDays}
          onContinue={handleContinue}
        />
      </CardContent>
    </Card>
  );
}
