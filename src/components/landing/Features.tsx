'use client';

import { Card, CardContent } from '@/components/ui/Card';

const features = [
  {
    title: 'Spaced Repetition',
    description: 'Science-backed algorithm schedules reviews at optimal intervals for long-term retention.',
    icon: '🧠',
  },
  {
    title: 'Code Syntax Focus',
    description: 'Practice real programming patterns, not trivia. Write actual code from memory.',
    icon: '💻',
  },
  {
    title: 'Track Progress & Streaks',
    description: 'Build consistency with daily streaks. Watch your accuracy improve over time.',
    icon: '📈',
  },
];

export function Features() {
  return (
    <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="p-6">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
