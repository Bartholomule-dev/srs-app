import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

interface ConversionScenario {
  inputValue: string;
  targetType: 'int' | 'float' | 'str' | 'bool';
  result: string;
}

const SCENARIOS: ConversionScenario[] = [
  // String to int
  { inputValue: '"42"', targetType: 'int', result: '42' },
  { inputValue: '"123"', targetType: 'int', result: '123' },
  { inputValue: '"-5"', targetType: 'int', result: '-5' },

  // Float to int (truncates)
  { inputValue: '3.7', targetType: 'int', result: '3' },
  { inputValue: '9.99', targetType: 'int', result: '9' },
  { inputValue: '-2.8', targetType: 'int', result: '-2' },

  // String to float
  { inputValue: '"3.14"', targetType: 'float', result: '3.14' },
  { inputValue: '"2.5"', targetType: 'float', result: '2.5' },

  // Int to float
  { inputValue: '5', targetType: 'float', result: '5.0' },
  { inputValue: '10', targetType: 'float', result: '10.0' },

  // To string
  { inputValue: '42', targetType: 'str', result: '"42"' },
  { inputValue: '3.14', targetType: 'str', result: '"3.14"' },
  { inputValue: 'True', targetType: 'str', result: '"True"' },
  { inputValue: '[1, 2]', targetType: 'str', result: '"[1, 2]"' },

  // To bool
  { inputValue: '0', targetType: 'bool', result: 'False' },
  { inputValue: '1', targetType: 'bool', result: 'True' },
  { inputValue: '""', targetType: 'bool', result: 'False' },
  { inputValue: '"hello"', targetType: 'bool', result: 'True' },
  { inputValue: '[]', targetType: 'bool', result: 'False' },
  { inputValue: '[0]', targetType: 'bool', result: 'True' },
];

export const typeConversionGenerator: Generator = {
  name: 'type-conversion',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const scenario = rng.pick(SCENARIOS);

    return {
      inputValue: scenario.inputValue,
      targetType: scenario.targetType,
      result: scenario.result,
      conversionCall: `${scenario.targetType}(${scenario.inputValue})`,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { inputValue, targetType, result } = params;

    if (
      typeof inputValue !== 'string' ||
      typeof targetType !== 'string' ||
      typeof result !== 'string'
    ) {
      return false;
    }

    const scenario = SCENARIOS.find(
      (s) => s.inputValue === inputValue && s.targetType === targetType
    );

    return scenario !== undefined && scenario.result === result;
  },
};
