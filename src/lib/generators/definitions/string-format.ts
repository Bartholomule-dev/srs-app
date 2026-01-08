// src/lib/generators/definitions/string-format.ts
// Generator for f-string and format exercises with realistic scenarios

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * Realistic scenarios for string formatting exercises.
 * Each produces a context-rich f-string exercise.
 */
interface FormatScenario {
  template: string; // The f-string template
  vars: Record<string, () => string | number>; // Variable generators
  category: string;
}

const NAMES = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Eve',
  'Frank',
  'Grace',
  'Henry',
];
const ITEMS = [
  'laptop',
  'phone',
  'book',
  'coffee',
  'ticket',
  'shirt',
  'watch',
  'headphones',
];
const CITIES = [
  'Paris',
  'Tokyo',
  'London',
  'Sydney',
  'Berlin',
  'Toronto',
  'Boston',
  'Seattle',
];
const LANGUAGES = [
  'Python',
  'JavaScript',
  'TypeScript',
  'Rust',
  'Go',
  'Java',
  'C++',
  'Ruby',
];

/**
 * string-format generator
 *
 * Generates premium f-string exercises with real-world scenarios.
 *
 * Output params vary by variant, but always include:
 * - result: the formatted string output
 * - code: Python code that produces the result
 */
export const stringFormatGenerator: Generator = {
  name: 'string-format',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    // Pick a variant for different exercise styles
    const variant = rng.pick([
      'greeting',
      'price',
      'stats',
      'message',
    ] as const);

    switch (variant) {
      case 'greeting': {
        const name = rng.pick(NAMES);
        const age = rng.int(20, 45);
        return {
          variant,
          name,
          age,
          result: `Hello, ${name}! You are ${age} years old.`,
          code: `name = "${name}"\nage = ${age}\nprint(f"Hello, {name}! You are {age} years old.")`,
          fstring: 'f"Hello, {name}! You are {age} years old."',
        };
      }
      case 'price': {
        const item = rng.pick(ITEMS);
        const price = rng.int(10, 200);
        const qty = rng.int(1, 5);
        const total = price * qty;
        return {
          variant,
          item,
          price,
          qty,
          total,
          result: `${qty} ${item}(s) at $${price} each: $${total}`,
          code: `item = "${item}"\nprice = ${price}\nqty = ${qty}\nprint(f"{qty} {item}(s) at ${price} each: ${price * qty}")`,
          fstring: `f"{qty} {item}(s) at \${price} each: \${price * qty}"`,
        };
      }
      case 'stats': {
        const correct = rng.int(7, 10);
        const total = 10;
        const pct = correct * 10;
        return {
          variant,
          correct,
          total,
          pct,
          result: `Score: ${correct}/${total} (${pct}%)`,
          code: `correct = ${correct}\ntotal = ${total}\nprint(f"Score: {correct}/{total} ({correct * 10}%)")`,
          fstring: 'f"Score: {correct}/{total} ({correct * 10}%)"',
        };
      }
      case 'message': {
        const sender = rng.pick(NAMES);
        const city = rng.pick(CITIES);
        return {
          variant,
          sender,
          city,
          result: `Message from ${sender} in ${city}`,
          code: `sender = "${sender}"\ncity = "${city}"\nprint(f"Message from {sender} in {city}")`,
          fstring: 'f"Message from {sender} in {city}"',
        };
      }
    }
  },

  validate(params: GeneratorParams): boolean {
    const { variant, result } = params;

    if (typeof variant !== 'string' || typeof result !== 'string') {
      return false;
    }

    // Recompute expected result based on variant
    switch (variant) {
      case 'greeting': {
        const { name, age } = params;
        if (typeof name !== 'string' || typeof age !== 'number') return false;
        return result === `Hello, ${name}! You are ${age} years old.`;
      }
      case 'price': {
        const { item, price, qty, total } = params;
        if (
          typeof item !== 'string' ||
          typeof price !== 'number' ||
          typeof qty !== 'number' ||
          typeof total !== 'number'
        )
          return false;
        if (total !== price * qty) return false;
        return result === `${qty} ${item}(s) at $${price} each: $${total}`;
      }
      case 'stats': {
        const { correct, total: tot, pct } = params;
        if (
          typeof correct !== 'number' ||
          typeof tot !== 'number' ||
          typeof pct !== 'number'
        )
          return false;
        return result === `Score: ${correct}/${tot} (${pct}%)`;
      }
      case 'message': {
        const { sender, city } = params;
        if (typeof sender !== 'string' || typeof city !== 'string') return false;
        return result === `Message from ${sender} in ${city}`;
      }
      default:
        return false;
    }
  },
};
