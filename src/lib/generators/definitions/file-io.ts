// src/lib/generators/definitions/file-io.ts
// Generator for file I/O operation exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';
import { tinyStoreLexicon } from '../tinystore-data';

/**
 * File I/O scenarios
 */
interface FileIOScenario {
  name: string;
  description: string;
  operation: 'read' | 'write' | 'append' | 'context';
  // Generate the file operation
  generate: (rng: ReturnType<typeof seededRandom>) => {
    filename: string;
    mode: string;
    content: string;
    code: string;
    result: string;
  };
}

const FILENAMES = tinyStoreLexicon.fileNames;
const SAMPLE_LINES = tinyStoreLexicon.sampleLines;

const SCENARIOS: FileIOScenario[] = [
  {
    name: 'read_all',
    description: 'read entire file contents',
    operation: 'read',
    generate: (rng) => {
      const filename = rng.pick(FILENAMES);
      const content = rng.pick(SAMPLE_LINES);
      return {
        filename,
        mode: 'r',
        content,
        code: `with open("${filename}", "r") as f:\n    content = f.read()\n    print(content)`,
        result: content,
      };
    },
  },
  {
    name: 'read_lines',
    description: 'read file as list of lines',
    operation: 'read',
    generate: (rng) => {
      const filename = rng.pick(FILENAMES);
      const line1 = rng.pick(SAMPLE_LINES);
      const line2 = rng.pick(SAMPLE_LINES.filter((l) => l !== line1));
      return {
        filename,
        mode: 'r',
        content: `${line1}\n${line2}`,
        code: `with open("${filename}", "r") as f:\n    lines = f.readlines()\n    print(len(lines))`,
        result: '2',
      };
    },
  },
  {
    name: 'write_text',
    description: 'write text to file',
    operation: 'write',
    generate: (rng) => {
      const filename = rng.pick(FILENAMES);
      const content = rng.pick(SAMPLE_LINES);
      return {
        filename,
        mode: 'w',
        content,
        code: `with open("${filename}", "w") as f:\n    f.write("${content}")\nprint("Done")`,
        result: 'Done',
      };
    },
  },
  {
    name: 'append_text',
    description: 'append text to file',
    operation: 'append',
    generate: (rng) => {
      const filename = rng.pick(FILENAMES);
      const content = rng.pick(SAMPLE_LINES);
      return {
        filename,
        mode: 'a',
        content,
        code: `with open("${filename}", "a") as f:\n    f.write("${content}\\n")\nprint("Appended")`,
        result: 'Appended',
      };
    },
  },
  {
    name: 'context_manager',
    description: 'use context manager for file handling',
    operation: 'context',
    generate: (rng) => {
      const filename = rng.pick(FILENAMES);
      return {
        filename,
        mode: 'r',
        content: '',
        code: `with open("${filename}") as f:\n    pass\nprint(f.closed)`,
        result: 'True',
      };
    },
  },
  {
    name: 'read_first_line',
    description: 'read first line only',
    operation: 'read',
    generate: (rng) => {
      const filename = rng.pick(FILENAMES);
      const line1 = rng.pick(SAMPLE_LINES);
      return {
        filename,
        mode: 'r',
        content: line1,
        code: `with open("${filename}", "r") as f:\n    first = f.readline()\n    print(first.strip())`,
        result: line1,
      };
    },
  },
];

/**
 * file-io generator
 *
 * Generates file I/O operation exercises.
 *
 * Output params:
 * - filename: name of file
 * - mode: file mode (r, w, a)
 * - content: file content
 * - code: Python code snippet
 * - result: expected output
 * - description: what the operation does
 * - operation: read, write, append, or context
 * - scenario: scenario name
 */
export const fileIOGenerator: Generator = {
  name: 'file-io',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const scenario = rng.pick(SCENARIOS);
    const generated = scenario.generate(rng);

    return {
      filename: generated.filename,
      mode: generated.mode,
      content: generated.content,
      code: generated.code,
      result: generated.result,
      description: scenario.description,
      operation: scenario.operation,
      scenario: scenario.name,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { filename, mode, result, scenario: scenarioName, operation } = params;

    if (
      typeof filename !== 'string' ||
      typeof mode !== 'string' ||
      typeof result !== 'string' ||
      typeof scenarioName !== 'string' ||
      typeof operation !== 'string'
    ) {
      return false;
    }

    const scenario = SCENARIOS.find((s) => s.name === scenarioName);
    if (!scenario) return false;

    return ['read', 'write', 'append', 'context'].includes(operation);
  },
};
