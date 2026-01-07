// src/app/practice/test/page.tsx
// Test-only page for E2E testing specific exercises by slug
// Usage: /practice/test?slug=exercise-slug

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProtectedRoute, ExerciseCard } from '@/components';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { mapExercise } from '@/lib/supabase/mappers';
import { renderExercise } from '@/lib/generators/render';
import type { Exercise } from '@/lib/types';

function PracticeTestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = searchParams.get('slug');

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('No exercise slug provided. Use ?slug=exercise-slug');
      setLoading(false);
      return;
    }

    // Wait for user to be available for deterministic seed generation
    if (!user) {
      return;
    }

    async function loadExercise() {
      const { data, error: dbError } = await supabase
        .from('exercises')
        .select('*')
        .eq('slug', slug)
        .single();

      if (dbError) {
        setError(`Failed to load exercise: ${dbError.message}`);
        setLoading(false);
        return;
      }

      if (!data) {
        setError(`Exercise not found: ${slug}`);
        setLoading(false);
        return;
      }

      // Map exercise and render any generator templates
      const mappedExercise = mapExercise(data);
      const renderedExercise = renderExercise(mappedExercise, user!.id, new Date());
      setExercise(renderedExercise);
      setLoading(false);
    }

    loadExercise();
  }, [slug, user]);

  const handleComplete = () => {
    // Stay on the page after completion for E2E assertions
    // The test can check the feedback state
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading exercise...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-500 underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No exercise loaded</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <ExerciseCard exercise={exercise} onComplete={handleComplete} />
      </div>
    </div>
  );
}

export default function PracticeTestPage() {
  return (
    <ProtectedRoute redirectTo="/">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <PracticeTestContent />
      </Suspense>
    </ProtectedRoute>
  );
}
