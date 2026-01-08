// src/lib/generators/definitions/conditional-chain.ts
// Generator for if/elif/else chain exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * Conditional chain scenarios
 */
interface ConditionalScenario {
  name: string;
  description: string;
  // Thresholds for the conditions
  thresholds: number[];
  // Labels for each branch
  labels: string[];
  // Generate the code given a value
  generateCode: (value: number, thresholds: number[], labels: string[]) => string;
  // Compute which branch is taken
  compute: (value: number, thresholds: number[]) => number;
}

const SCENARIOS: ConditionalScenario[] = [
  {
    name: 'grade',
    description: 'grade classification',
    thresholds: [90, 80, 70, 60],
    labels: ['A', 'B', 'C', 'D', 'F'],
    generateCode: (value, thresholds, labels) => `score = ${value}
if score >= ${thresholds[0]}:
    grade = "${labels[0]}"
elif score >= ${thresholds[1]}:
    grade = "${labels[1]}"
elif score >= ${thresholds[2]}:
    grade = "${labels[2]}"
elif score >= ${thresholds[3]}:
    grade = "${labels[3]}"
else:
    grade = "${labels[4]}"
print(grade)`,
    compute: (value, thresholds) => {
      if (value >= thresholds[0]) return 0;
      if (value >= thresholds[1]) return 1;
      if (value >= thresholds[2]) return 2;
      if (value >= thresholds[3]) return 3;
      return 4;
    },
  },
  {
    name: 'age_category',
    description: 'age category classification',
    thresholds: [65, 18, 13],
    labels: ['senior', 'adult', 'teen', 'child'],
    generateCode: (value, thresholds, labels) => `age = ${value}
if age >= ${thresholds[0]}:
    category = "${labels[0]}"
elif age >= ${thresholds[1]}:
    category = "${labels[1]}"
elif age >= ${thresholds[2]}:
    category = "${labels[2]}"
else:
    category = "${labels[3]}"
print(category)`,
    compute: (value, thresholds) => {
      if (value >= thresholds[0]) return 0;
      if (value >= thresholds[1]) return 1;
      if (value >= thresholds[2]) return 2;
      return 3;
    },
  },
  {
    name: 'temperature',
    description: 'temperature feeling',
    thresholds: [30, 20, 10],
    labels: ['hot', 'warm', 'cool', 'cold'],
    generateCode: (value, thresholds, labels) => `temp = ${value}
if temp >= ${thresholds[0]}:
    feeling = "${labels[0]}"
elif temp >= ${thresholds[1]}:
    feeling = "${labels[1]}"
elif temp >= ${thresholds[2]}:
    feeling = "${labels[2]}"
else:
    feeling = "${labels[3]}"
print(feeling)`,
    compute: (value, thresholds) => {
      if (value >= thresholds[0]) return 0;
      if (value >= thresholds[1]) return 1;
      if (value >= thresholds[2]) return 2;
      return 3;
    },
  },
  {
    name: 'size',
    description: 'size classification',
    thresholds: [100, 50, 10],
    labels: ['XL', 'L', 'M', 'S'],
    generateCode: (value, thresholds, labels) => `weight = ${value}
if weight >= ${thresholds[0]}:
    size = "${labels[0]}"
elif weight >= ${thresholds[1]}:
    size = "${labels[1]}"
elif weight >= ${thresholds[2]}:
    size = "${labels[2]}"
else:
    size = "${labels[3]}"
print(size)`,
    compute: (value, thresholds) => {
      if (value >= thresholds[0]) return 0;
      if (value >= thresholds[1]) return 1;
      if (value >= thresholds[2]) return 2;
      return 3;
    },
  },
  {
    name: 'discount',
    description: 'discount tier',
    thresholds: [1000, 500, 100],
    labels: ['30%', '20%', '10%', '0%'],
    generateCode: (value, thresholds, labels) => `total = ${value}
if total >= ${thresholds[0]}:
    discount = "${labels[0]}"
elif total >= ${thresholds[1]}:
    discount = "${labels[1]}"
elif total >= ${thresholds[2]}:
    discount = "${labels[2]}"
else:
    discount = "${labels[3]}"
print(discount)`,
    compute: (value, thresholds) => {
      if (value >= thresholds[0]) return 0;
      if (value >= thresholds[1]) return 1;
      if (value >= thresholds[2]) return 2;
      return 3;
    },
  },
];

/**
 * conditional-chain generator
 *
 * Generates if/elif/else chain exercises.
 *
 * Output params:
 * - value: input value
 * - result: which branch is taken (the label)
 * - description: what kind of classification
 * - code: Python code snippet
 * - scenario: scenario name
 * - branchIndex: which branch (0-indexed)
 */
export const conditionalChainGenerator: Generator = {
  name: 'conditional-chain',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const scenario = rng.pick(SCENARIOS);

    // Generate a value that could fall into any branch
    let value: number;
    switch (scenario.name) {
      case 'grade':
        value = rng.int(50, 100);
        break;
      case 'age_category':
        value = rng.int(5, 80);
        break;
      case 'temperature':
        value = rng.int(0, 40);
        break;
      case 'size':
        value = rng.int(5, 120);
        break;
      case 'discount':
        value = rng.int(50, 1200);
        break;
      default:
        value = rng.int(0, 100);
    }

    const branchIndex = scenario.compute(value, scenario.thresholds);
    const result = scenario.labels[branchIndex];
    const code = scenario.generateCode(value, scenario.thresholds, scenario.labels);

    return {
      value,
      result,
      description: scenario.description,
      code,
      scenario: scenario.name,
      branchIndex,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { value, result, scenario: scenarioName, branchIndex } = params;

    if (
      typeof value !== 'number' ||
      typeof result !== 'string' ||
      typeof scenarioName !== 'string' ||
      typeof branchIndex !== 'number'
    ) {
      return false;
    }

    const scenario = SCENARIOS.find((s) => s.name === scenarioName);
    if (!scenario) return false;

    const expectedBranch = scenario.compute(value, scenario.thresholds);
    const expectedResult = scenario.labels[expectedBranch];

    return branchIndex === expectedBranch && result === expectedResult;
  },
};
