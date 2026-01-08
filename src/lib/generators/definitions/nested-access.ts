// src/lib/generators/definitions/nested-access.ts
// Generator for nested data structure access exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * Nested access scenarios with computed results
 */
interface NestedAccessScenario {
  name: string;
  description: string;
  // Function to generate the data structure and access expression
  generate: (rng: ReturnType<typeof seededRandom>) => {
    dataStr: string;
    varName: string;
    accessExpr: string;
    result: string;
    code: string;
  };
}

const SCENARIOS: NestedAccessScenario[] = [
  {
    name: 'list_of_dicts',
    description: 'list containing dictionaries',
    generate: (rng) => {
      const names = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'];
      const ages = [25, 30, 35, 28, 32];
      const name = rng.pick(names);
      const age = rng.pick(ages);
      const name2 = rng.pick(names.filter((n) => n !== name));
      const age2 = rng.pick(ages.filter((a) => a !== age));

      const dataStr = `[{'name': '${name}', 'age': ${age}}, {'name': '${name2}', 'age': ${age2}}]`;

      const accessIdx = rng.int(0, 1);
      const field = rng.pick(['name', 'age']);
      const accessExpr = `users[${accessIdx}]["${field}"]`;
      const result = accessIdx === 0 ? (field === 'name' ? name : String(age)) : (field === 'name' ? name2 : String(age2));

      return {
        dataStr,
        varName: 'users',
        accessExpr,
        result: field === 'name' ? `'${result}'` : result,
        code: `users = ${dataStr}\nprint(users[${accessIdx}]["${field}"])`,
      };
    },
  },
  {
    name: 'dict_of_lists',
    description: 'dictionary containing lists',
    generate: (rng) => {
      const keys = ['scores', 'grades', 'values', 'items', 'nums'];
      const key1 = rng.pick(keys);
      const key2 = rng.pick(keys.filter((k) => k !== key1));

      const list1 = [rng.int(70, 100), rng.int(70, 100), rng.int(70, 100)];
      const list2 = [rng.int(70, 100), rng.int(70, 100), rng.int(70, 100)];

      const dataStr = `{'${key1}': [${list1.join(', ')}], '${key2}': [${list2.join(', ')}]}`;

      const accessKey = rng.pick([key1, key2]);
      const accessIdx = rng.int(0, 2);
      const targetList = accessKey === key1 ? list1 : list2;
      const result = String(targetList[accessIdx]);

      return {
        dataStr,
        varName: 'data',
        accessExpr: `data["${accessKey}"][${accessIdx}]`,
        result,
        code: `data = ${dataStr}\nprint(data["${accessKey}"][${accessIdx}])`,
      };
    },
  },
  {
    name: 'nested_dict',
    description: 'nested dictionaries',
    generate: (rng) => {
      const outerKeys = ['user', 'config', 'settings', 'profile', 'account'];
      const innerKeys = ['name', 'email', 'status', 'role', 'level'];
      const values = ['admin', 'active', 'premium', 'guest', 'enabled'];

      const outerKey = rng.pick(outerKeys);
      const innerKey1 = rng.pick(innerKeys);
      const innerKey2 = rng.pick(innerKeys.filter((k) => k !== innerKey1));
      const value1 = rng.pick(values);
      const value2 = rng.pick(values.filter((v) => v !== value1));

      const dataStr = `{'${outerKey}': {'${innerKey1}': '${value1}', '${innerKey2}': '${value2}'}}`;

      const accessInnerKey = rng.pick([innerKey1, innerKey2]);
      const result = accessInnerKey === innerKey1 ? value1 : value2;

      return {
        dataStr,
        varName: 'config',
        accessExpr: `config["${outerKey}"]["${accessInnerKey}"]`,
        result: `'${result}'`,
        code: `config = ${dataStr}\nprint(config["${outerKey}"]["${accessInnerKey}"])`,
      };
    },
  },
  {
    name: 'nested_list',
    description: 'list of lists (2D array)',
    generate: (rng) => {
      const rows = [
        [rng.int(1, 9), rng.int(1, 9), rng.int(1, 9)],
        [rng.int(1, 9), rng.int(1, 9), rng.int(1, 9)],
        [rng.int(1, 9), rng.int(1, 9), rng.int(1, 9)],
      ];

      const dataStr = `[[${rows[0].join(', ')}], [${rows[1].join(', ')}], [${rows[2].join(', ')}]]`;

      const rowIdx = rng.int(0, 2);
      const colIdx = rng.int(0, 2);
      const result = String(rows[rowIdx][colIdx]);

      return {
        dataStr,
        varName: 'matrix',
        accessExpr: `matrix[${rowIdx}][${colIdx}]`,
        result,
        code: `matrix = ${dataStr}\nprint(matrix[${rowIdx}][${colIdx}])`,
      };
    },
  },
  {
    name: 'mixed_access',
    description: 'mixed index and key access',
    generate: (rng) => {
      const categories = ['fruits', 'colors', 'animals', 'cities', 'foods'];
      const items1 = ['apple', 'red', 'cat', 'Paris', 'pizza'];
      const items2 = ['banana', 'blue', 'dog', 'London', 'pasta'];
      const items3 = ['cherry', 'green', 'bird', 'Tokyo', 'sushi'];

      const cat = rng.pick(categories);
      const catIdx = categories.indexOf(cat);
      const itemsForCat = [items1[catIdx], items2[catIdx], items3[catIdx]];

      const dataStr = `{'${cat}': ['${itemsForCat[0]}', '${itemsForCat[1]}', '${itemsForCat[2]}']}`;

      const accessIdx = rng.int(0, 2);
      const result = itemsForCat[accessIdx];

      return {
        dataStr,
        varName: 'data',
        accessExpr: `data["${cat}"][${accessIdx}]`,
        result: `'${result}'`,
        code: `data = ${dataStr}\nprint(data["${cat}"][${accessIdx}])`,
      };
    },
  },
];

/**
 * nested-access generator
 *
 * Generates nested data structure access exercises.
 *
 * Output params:
 * - dataStr: string representation of the data structure
 * - varName: variable name for the data
 * - accessExpr: the access expression
 * - result: computed result
 * - description: what kind of nested structure
 * - code: Python code snippet
 * - scenario: scenario name
 */
export const nestedAccessGenerator: Generator = {
  name: 'nested-access',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const scenario = rng.pick(SCENARIOS);
    const generated = scenario.generate(rng);

    return {
      dataStr: generated.dataStr,
      varName: generated.varName,
      accessExpr: generated.accessExpr,
      result: generated.result,
      description: scenario.description,
      code: generated.code,
      scenario: scenario.name,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { dataStr, varName, accessExpr, result, scenario: scenarioName } = params;

    if (
      typeof dataStr !== 'string' ||
      typeof varName !== 'string' ||
      typeof accessExpr !== 'string' ||
      typeof result !== 'string' ||
      typeof scenarioName !== 'string'
    ) {
      return false;
    }

    const scenario = SCENARIOS.find((s) => s.name === scenarioName);
    if (!scenario) return false;

    // Basic structure validation - the code should be properly formed
    return dataStr.length > 0 && accessExpr.includes(varName);
  },
};
