'use client';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning!';
  if (hour >= 12 && hour < 17) return 'Good afternoon!';
  if (hour >= 17 && hour < 21) return 'Good evening!';
  return 'Good night!';
}

export function Greeting() {
  const greeting = getGreeting();

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {greeting}
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Ready to practice?
      </p>
    </div>
  );
}
