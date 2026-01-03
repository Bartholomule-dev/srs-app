import Link from 'next/link';

export function LandingHeader() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900 dark:text-white">
          SyntaxSRS
        </span>
        <Link
          href="#auth"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
