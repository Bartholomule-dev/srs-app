import type { ExerciseType } from '@/lib/curriculum/types';

interface ExercisePromptProps {
  category: string;
  language: string;
  prompt: string;
  exerciseType?: ExerciseType;
}

export function ExercisePrompt({ category, language, prompt, exerciseType }: ExercisePromptProps) {
  return (
    <div>
      <header className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-4" role="banner">
        <span className="font-medium text-[var(--accent-primary)]">{language}</span>
        <span aria-hidden="true">/</span>
        <span>{category}</span>
        {exerciseType && (
          <>
            <span aria-hidden="true">/</span>
            <span data-testid="exercise-type">{exerciseType}</span>
          </>
        )}
      </header>
      <p className="text-lg text-[var(--text-primary)]" data-testid="exercise-prompt">{prompt}</p>
    </div>
  );
}
