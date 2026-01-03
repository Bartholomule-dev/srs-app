interface ExercisePromptProps {
  category: string;
  language: string;
  prompt: string;
}

export function ExercisePrompt({ category, language, prompt }: ExercisePromptProps) {
  return (
    <div>
      <header className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-4" role="banner">
        <span className="font-medium text-blue-600 dark:text-blue-400">{language}</span>
        <span aria-hidden="true">/</span>
        <span>{category}</span>
      </header>
      <p className="text-lg text-neutral-900 dark:text-neutral-100">{prompt}</p>
    </div>
  );
}
