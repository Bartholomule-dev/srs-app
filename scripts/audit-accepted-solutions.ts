#!/usr/bin/env npx tsx
/**
 * Find write exercises that might need accepted_solutions variants
 */

import * as fs from 'fs';
import YAML from 'yaml';

const files = fs.readdirSync('exercises/python').filter(f => f.endsWith('.yaml'));

// Find write exercises without accepted_solutions that might need them
const needsSolutions: string[] = [];

for (const file of files) {
  const content = fs.readFileSync(`exercises/python/${file}`, 'utf-8');
  const data = YAML.parse(content);

  for (const ex of data.exercises || []) {
    if (ex.type !== 'write') continue;
    if (ex.accepted_solutions && ex.accepted_solutions.length > 0) continue;

    const answer = ex.expected_answer || '';

    // Check if answer could have multiple valid forms
    const hasQuotes = answer.includes('"') || answer.includes("'");
    const hasFstring = answer.includes('f"') || answer.includes("f'");
    const hasStringLiteral = /["'][^"']+["']/.test(answer);
    const hasParens = answer.includes('(') && answer.includes(')');

    // Exercises that likely have only one valid answer
    const simplePatterns = [
      /^[a-z_]+$/, // single variable name
      /^[a-z_]+\.[a-z_]+$/, // method access like list.append
      /^[a-z_]+\s*=\s*[a-z_\[\]{}]+$/, // simple assignment
      /^class\s+\w+:$/, // class definition
      /^def\s+\w+\([^)]*\):$/, // function def
      /^return\s+[a-z_]+$/, // simple return
      /^import\s+\w+$/, // simple import
      /^from\s+\w+\s+import\s+\w+$/, // from import
    ];

    const isSimple = simplePatterns.some(p => p.test(answer));

    if (!isSimple && (hasQuotes || hasFstring || hasStringLiteral) && hasParens) {
      needsSolutions.push(`${file}: ${ex.slug} - "${answer.substring(0, 60)}${answer.length > 60 ? '...' : ''}"`);
    }
  }
}

console.log('=== EXERCISES THAT MIGHT NEED accepted_solutions ===');
console.log(`Found ${needsSolutions.length} exercises with quotes/strings that might need variants:\n`);
needsSolutions.forEach(s => console.log(s));
