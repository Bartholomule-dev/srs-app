const steps = [
  { number: 1, text: 'Get daily exercises based on your schedule' },
  { number: 2, text: 'Type the code from memory' },
  { number: 3, text: 'Algorithm adjusts timing based on accuracy' },
];

export function HowItWorks() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          How it works
        </h2>
        <div className="space-y-6">
          {steps.map((step) => (
            <div key={step.number} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold flex-shrink-0">
                {step.number}
              </div>
              <p className="text-lg text-gray-700 dark:text-gray-300 pt-1">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
