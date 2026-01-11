// scripts/add-curriculum-ladders.ts
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const curriculumPath = join(process.cwd(), 'src/lib/curriculum/python.json');
const raw = readFileSync(curriculumPath, 'utf-8');
const curriculum = JSON.parse(raw) as {
  subconcepts: Record<string, Record<string, unknown>>;
};

const defaultLadder = {
  intro: 2,
  practice: 3,
  edge: 1,
  integrated: 1,
};

let updatedCount = 0;

for (const subconcept of Object.values(curriculum.subconcepts)) {
  if (!subconcept.ladder) {
    subconcept.ladder = { ...defaultLadder };
    updatedCount += 1;
  }
}

writeFileSync(curriculumPath, `${JSON.stringify(curriculum, null, 2)}\n`, 'utf-8');
console.log(`Added ladder defaults to ${updatedCount} subconcepts.`);
