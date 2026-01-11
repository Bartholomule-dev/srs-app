# Phase 0 Audit - Exercise Library Baseline

Scope: exercises/python/*.yaml + paths/python/blueprints/*.yaml with validation against src/lib/curriculum/python.json.

Sources referenced:
- /home/brett/GoogleDrive/Obsidian Vault/SRS-app/Exercises/index.md
- /home/brett/GoogleDrive/Obsidian Vault/SRS-app/Blueprints.md
- /home/brett/GoogleDrive/Obsidian Vault/SRS-app/Grading-Rubric.md

## Snapshot (YAML Source of Truth)
- Total exercises: 529 (matches Obsidian index)
- Dynamic exercises: 109
- Integrated exercises: 32
- Types: write 319, fill-in 71, predict 139
- Levels: intro 207, practice 237, edge 53, integrated 32

### By Concept (total / dynamic / integrated)
- collections: 81 / 16 / 5
- comprehensions: 33 / 7 / 2
- conditionals: 30 / 0 / 3
- error-handling: 28 / 5 / 3
- foundations: 47 / 14 / 1
- functions: 55 / 8 / 4
- loops: 78 / 19 / 3
- modules-files: 39 / 7 / 3
- numbers-booleans: 50 / 18 / 3
- oop: 34 / 5 / 2
- strings: 54 / 10 / 3

## Blueprint Coverage
- Covered exercises: 507 / 529
- Orphaned exercises: 22 (see appendix)
- Concepts with coverage gaps: collections, conditionals, error-handling, loops, modules-files, numbers-booleans, strings

## Taxonomy Integrity
### Invalid prereqs (49 total, 11 distinct)
Top invalid prereqs:
- control-flow.for (23)
- control-flow.conditionals (6)
- control-flow.sorted (4)
- control-flow.while (3)
- control-flow.zip (3)
- control-flow.any-all (3)
- functions.define (2)
- arithmetic (2)
- foundations.conversion (1)
- control-flow.reversed (1)
- boolean-ops (1)

Notes:
- 43/49 invalid prereqs use the legacy control-flow.* prefix.
- 2 invalid prereqs use a non-existent functions.define alias.
- foundations.conversion and boolean-ops appear as non-canonical prereq namespaces.

### Unexpected subconcepts (9 exercises)
These exercises use subconcepts not present in their concept definition:
- loops.yaml: if-greater-dynamic, comparison-result-dynamic, bool-compound-dynamic, if-bool-logic-dynamic, if-elif-else-predict-dynamic, if-elif-chain-trace-dynamic (subconcept: conditionals)
- numbers-booleans.yaml: number-stats-from-list, number-round-format (subconcept: arithmetic), boolean-all-check (subconcept: boolean-ops)

### Tag collisions (canonicalization needed)
- anti-pattern vs antipattern
- f-string vs fstring
- f-strings vs fstrings

## Ladder Coverage (Subconcept Level)
Missing levels (counts across 68 subconcepts):
- Missing intro: 4
- Missing practice: 6
- Missing edge: 31
- Missing integrated: 47

Subconcepts with only integrated exercises:
- arithmetic, boolean-ops, dataclasses, decorators

Subconcepts missing integrated (47 total):
any-all, args-kwargs, arguments, basics, booleans, break-continue, classes, classmethod,
comparisons, conditionals, context, conversion, defaults, dict-comp, elif-chains,
expressions, finally, floats, generators, identity, imports-basic, indexing, inheritance,
integers, iteration, main-guard, match-case, methods, mutability, operators, pathlib,
properties, raising, range, reversed, scope, set-comp, sets, slicing, sorted, ternary,
truthiness, tuples, unpacking, variables, while, zip

Subconcepts missing edge (31 total):
arithmetic, basics, boolean-ops, booleans, classes, comparisons, context, conversion,
dataclasses, decorators, dict-comp, dicts, expressions, floats, fn-basics, generator-exp,
imports, indexing, integers, iteration, methods, operators, reading, set-comp, sets,
string-methods, truthiness, try-except, tuples, variables, writing

## Duplicate or Overlapping Prompts
5 duplicate prompt/answer groups detected. Key collisions:
- list-sum-dynamic (collections.yaml) vs int-addition-dynamic (numbers-booleans.yaml)
- import-math (foundations.yaml) vs import-module (modules-files.yaml)
- import-from-math (foundations.yaml) vs import-from (modules-files.yaml)
- list-method-predict-dynamic / nested-access-predict-dynamic / default-args-predict-dynamic /
  if-elif-else-predict-dynamic / file-context-dynamic / fstring-greeting-dynamic /
  string-slice-advanced-dynamic (shared prompt template)
- sorted-predict-dynamic vs zip-sum-dynamic (loops.yaml)

## Quality Heuristics (Rubric Risk Flags)
- Predict exercises without explicit grading_strategy: 139 (all predict exercises)
- Write exercises missing accepted_solutions: 35
- Quote-heavy write exercises without accepted_solutions: 1 (default-args-call-dynamic)

## Target Ladder Template (Baseline)
Suggested per-subconcept ladder for a premium, intentional flow:
- Intro: 2 (single-skill, low ambiguity)
- Practice: 3 (varied contexts, deeper decision depth)
- Edge: 1 (pitfall or exception case)
- Integrated: 1 (multi-skill, narrative task)
Total: 7 exercises per subconcept as a baseline, with flexibility for large topics.

## Priority Review List (20)
These are highest-leverage items to fix first:
1) if-greater-dynamic
2) comparison-result-dynamic
3) bool-compound-dynamic
4) if-bool-logic-dynamic
5) if-elif-else-predict-dynamic
6) if-elif-chain-trace-dynamic
7) number-stats-from-list
8) number-round-format
9) boolean-all-check
10) list-sum-dynamic
11) int-addition-dynamic
12) import-math
13) import-module
14) import-from-math
15) import-from
16) list-method-predict-dynamic
17) nested-access-predict-dynamic
18) default-args-predict-dynamic
19) file-context-dynamic
20) fstring-greeting-dynamic

## Appendix: Orphaned Exercises (Not in Blueprints)
list-to-dict-conversion
list-dedup-preserve-order
dict-from-parallel-lists
sort-dict-by-value
filter-list-of-dicts
conditional-dict-validation
conditional-list-any
conditional-early-return
error-handling-file-read
error-handling-dict-access
error-handling-conversion
loop-dict-accumulate
loop-nested-flatten
file-read-to-list
file-write-from-list
import-json-parse
number-stats-from-list
boolean-all-check
number-round-format
string-split-filter
fstring-from-dict
string-join-transformed
