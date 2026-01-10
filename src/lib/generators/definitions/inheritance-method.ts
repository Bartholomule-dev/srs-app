// src/lib/generators/definitions/inheritance-method.ts
// Generator for OOP inheritance method resolution exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

interface InheritanceScenario {
  name: string;
  parentClass: string;
  childClass: string;
  method: string;
  parentImpl: string;
  childImpl: string | null; // null means no override
  callOn: 'parent' | 'child';
  result: string;
  description: string;
}

const SCENARIOS: InheritanceScenario[] = [
  {
    name: 'override_method',
    parentClass: 'Animal',
    childClass: 'Dog',
    method: 'speak',
    parentImpl: '"Animal sound"',
    childImpl: '"Woof!"',
    callOn: 'child',
    result: 'Woof!',
    description: 'Child overrides parent method',
  },
  {
    name: 'inherit_method',
    parentClass: 'Vehicle',
    childClass: 'Car',
    method: 'start',
    parentImpl: '"Engine started"',
    childImpl: null,
    callOn: 'child',
    result: 'Engine started',
    description: 'Child inherits parent method',
  },
  {
    name: 'parent_direct',
    parentClass: 'Shape',
    childClass: 'Circle',
    method: 'describe',
    parentImpl: '"I am a shape"',
    childImpl: '"I am a circle"',
    callOn: 'parent',
    result: 'I am a shape',
    description: 'Call method on parent instance',
  },
  {
    name: 'super_extend',
    parentClass: 'Counter',
    childClass: 'DoubleCounter',
    method: 'count',
    parentImpl: '1',
    childImpl: 'super().count() * 2',
    callOn: 'child',
    result: '2',
    description: 'Child extends parent using super()',
  },
  {
    name: 'override_returns_different',
    parentClass: 'Calculator',
    childClass: 'ScientificCalculator',
    method: 'add',
    parentImpl: '2 + 3',
    childImpl: '(2 + 3) * 10',
    callOn: 'child',
    result: '50',
    description: 'Child completely overrides calculation',
  },
];

function generateCode(scenario: InheritanceScenario): string {
  const lines: string[] = [];

  // Parent class
  lines.push(`class ${scenario.parentClass}:`);
  lines.push(`    def ${scenario.method}(self):`);
  lines.push(`        return ${scenario.parentImpl}`);
  lines.push('');

  // Child class
  lines.push(`class ${scenario.childClass}(${scenario.parentClass}):`);
  if (scenario.childImpl) {
    lines.push(`    def ${scenario.method}(self):`);
    lines.push(`        return ${scenario.childImpl}`);
  } else {
    lines.push('    pass');
  }
  lines.push('');

  // Instantiation and call
  if (scenario.callOn === 'child') {
    lines.push(`obj = ${scenario.childClass}()`);
  } else {
    lines.push(`obj = ${scenario.parentClass}()`);
  }
  lines.push(`print(obj.${scenario.method}())`);

  return lines.join('\n');
}

export const inheritanceMethodGenerator: Generator = {
  name: 'inheritance-method',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const scenario = rng.pick(SCENARIOS);
    const code = generateCode(scenario);

    return {
      parentClass: scenario.parentClass,
      childClass: scenario.childClass,
      method: scenario.method,
      result: scenario.result,
      description: scenario.description,
      scenario: scenario.name,
      callOn: scenario.callOn,
      // Which class actually provides the method implementation
      implementingClass:
        scenario.callOn === 'parent'
          ? scenario.parentClass
          : scenario.childImpl
            ? scenario.childClass
            : scenario.parentClass,
      code,
    };
  },

  validate(params: GeneratorParams): boolean {
    return (
      typeof params.parentClass === 'string' &&
      params.parentClass.length > 0 &&
      typeof params.childClass === 'string' &&
      params.childClass.length > 0 &&
      typeof params.method === 'string' &&
      params.method.length > 0 &&
      typeof params.result === 'string' &&
      typeof params.description === 'string' &&
      typeof params.scenario === 'string' &&
      typeof params.callOn === 'string' &&
      typeof params.implementingClass === 'string' &&
      params.implementingClass.length > 0 &&
      typeof params.code === 'string' &&
      params.code.includes('class ')
    );
  },
};
