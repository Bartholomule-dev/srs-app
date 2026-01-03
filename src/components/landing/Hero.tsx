import { AuthForm } from './AuthForm';

export function Hero() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Keep Your Code Skills Sharp
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Practice syntax through spaced repetition.
          <br />
          Built for developers who use AI assistants.
        </p>
        <div className="flex justify-center">
          <AuthForm />
        </div>
      </div>
    </section>
  );
}
