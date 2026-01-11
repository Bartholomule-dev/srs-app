// src/lib/generators/definitions/path-ops.ts
// Generator for pathlib exercises with realistic file paths

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';
import { tinyStoreLexicon } from '../tinystore-data';

/**
 * Realistic directory and file names for premium exercises
 */
const DIRECTORIES = tinyStoreLexicon.pathDirs;
const SUBDIRECTORIES = tinyStoreLexicon.pathSubdirs;
const FILE_NAMES = tinyStoreLexicon.fileNames.map((name) => name.split('.')[0]);
const EXTENSIONS = Array.from(
  new Set(tinyStoreLexicon.fileNames.map((name) => name.slice(name.lastIndexOf('.'))))
);

/**
 * path-ops generator
 *
 * Generates realistic file path scenarios for pathlib exercises.
 * Produces paths that look like real project structures.
 *
 * Output params:
 * - dir1: first directory name
 * - dir2: subdirectory name
 * - filename: file name with extension
 * - fullPath: complete path string (e.g., "src/api/config.py")
 * - parent: parent directory of fullPath
 * - stem: filename without extension
 * - suffix: file extension (e.g., ".py")
 * - variant: which exercise variant to use
 */
export const pathOpsGenerator: Generator = {
  name: 'path-ops',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const dir1 = rng.pick(DIRECTORIES);
    const dir2 = rng.pick(SUBDIRECTORIES);
    const baseName = rng.pick(FILE_NAMES);
    const ext = rng.pick(EXTENSIONS);

    const filename = `${baseName}${ext}`;
    const fullPath = `${dir1}/${dir2}/${filename}`;
    const parent = `${dir1}/${dir2}`;

    // Pick a variant for different exercise types
    const variant = rng.pick([
      'join',
      'parent',
      'stem',
      'suffix',
      'parts',
    ] as const);

    // Compute variant-specific results
    let result: string;
    switch (variant) {
      case 'join':
        result = fullPath;
        break;
      case 'parent':
        result = parent;
        break;
      case 'stem':
        result = baseName;
        break;
      case 'suffix':
        result = ext;
        break;
      case 'parts':
        result = `('${dir1}', '${dir2}', '${filename}')`;
        break;
    }

    return {
      dir1,
      dir2,
      filename,
      baseName,
      ext,
      fullPath,
      parent,
      stem: baseName,
      suffix: ext,
      variant,
      result,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { dir1, dir2, filename, fullPath, parent, stem, suffix, variant, result } =
      params;

    // Type checks
    if (
      typeof dir1 !== 'string' ||
      typeof dir2 !== 'string' ||
      typeof filename !== 'string' ||
      typeof fullPath !== 'string' ||
      typeof parent !== 'string' ||
      typeof stem !== 'string' ||
      typeof suffix !== 'string' ||
      typeof variant !== 'string' ||
      typeof result !== 'string'
    ) {
      return false;
    }

    // Validate path construction
    if (fullPath !== `${dir1}/${dir2}/${filename}`) return false;
    if (parent !== `${dir1}/${dir2}`) return false;

    // Validate variant-specific results
    switch (variant) {
      case 'join':
        return result === fullPath;
      case 'parent':
        return result === parent;
      case 'stem':
        return result === stem;
      case 'suffix':
        return result === suffix;
      case 'parts':
        return result === `('${dir1}', '${dir2}', '${filename}')`;
      default:
        return false;
    }
  },
};
