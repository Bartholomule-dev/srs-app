interface ExercisePromptProps {
  category: string;
  language: string;
  prompt: string;
}

export function ExercisePrompt({ category, language, prompt }: ExercisePromptProps) {
  return (
    <div>
      <header className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-4" role="banner">
        <span className="font-medium text-[var(--accent-primary)]">{language}</span>
        <span aria-hidden="true">/</span>
        <span>{category}</span>
      </header>
      <p className="text-lg text-[var(--text-primary)]">{prompt}</p>
    </div>
  );
}
