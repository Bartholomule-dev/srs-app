# Premium Exercise Curriculum Upgrade Plan (End-to-End)

Goal: make the exercise set feel connected, intentional, and premium by tightening the curriculum graph, unifying narrative context, and raising grading quality.

Sources:
- /home/brett/GoogleDrive/Obsidian Vault/SRS-app/Exercises/index.md (current exercise counts and coverage)
- /home/brett/GoogleDrive/Obsidian Vault/SRS-app/Blueprints.md (blueprint beats and skins)
- /home/brett/GoogleDrive/Obsidian Vault/SRS-app/Grading-Rubric.md (quality rubric)
- exercises/python/*.yaml and src/lib/curriculum/python.json (source of truth for content and graph)

## North Star Outcomes
- Cohesive narrative: a single, recognizable domain and dataset threads through all concepts.
- Intentional sequencing: prerequisites are correct, consistent, and enforced by the skill tree.
- Premium quality: exercises score high against the rubric and feel polished, precise, and practical.
- Integrated mastery: integrated exercises and blueprints reinforce cross-concept transfer.

## Success Metrics
- Prereq graph: 0 unknown prereq slugs, 0 legacy namespace prereqs.
- Narrative coverage: 80%+ of exercises use shared entities, variables, or datasets.
- Rubric quality: average score >= 32, no exercise below 24.
- Level balance: each subconcept has a clear ladder (intro -> practice -> edge -> integrated).
- Blueprint alignment: 100% of blueprints include at least one integrated exercise per concept cluster.

## Workstreams and Phases

### Phase 0: Baseline and Audit
Deliverables:
- Snapshot of current coverage by concept/subconcept/level/type/dynamic.
- Audit report for duplicates, mislevels, and taxonomy drift.
- Target ladder template per subconcept (counts per level).
Tasks:
- Parse Obsidian exercise index for counts and compare with YAML.
- Build audit lists: duplicated objectives, inconsistent tags, missing integrated ladders.
- Identify top 20 exercises with lowest rubric fit or clarity.
Exit Criteria:
- Audit doc approved and a prioritized backlog exists.

### Phase 1: Taxonomy and Validation Hardening
Deliverables:
- Canonical prereq slug registry from python.json.
- Tag registry with allowed values and alias map (ex: fstrings vs f-strings).
- Validation script or lint rules for prereqs, tags, levels, and targets.
Tasks:
- Replace legacy prereq namespaces in YAML with canonical slugs.
- Add a prereq alias map in validation (for one-time migration only).
- Enforce required fields and structured targets for integrated exercises.
Exit Criteria:
- Validation fails on any unknown prereqs/tags; all YAMLs pass.

### Phase 2: Narrative Spine and Lexicon
Deliverables:
- Narrative Bible (domain, entities, datasets, events, variable naming).
- Canonical datasets (small, medium, and large variants for generators).
- Prompt language guide (tone, verbs, consistent names).
Reference:
- docs/plans/2026-01-11-phase2-narrative-bible.md
Tasks:
- Pick a single base domain (ex: TinyStore: users, products, orders, logs).
- Define standard variable names (user_id, order_total, log_line).
- Map existing skins to the base narrative via substitutions.
Exit Criteria:
- Narrative Bible approved and linked in docs; generators reference canonical datasets.

### Phase 3: Subconcept Ladders and Cross-Concept Bridges
Deliverables:
- Ladder map per subconcept (intro, practice, edge, integrated).
- Bridge exercises that connect concepts (strings -> collections -> loops -> comprehensions).
References:
- docs/plans/2026-01-11-phase3-subconcept-ladders.md
- docs/plans/2026-01-11-phase3-bridge-exercises.md
Tasks:
- Ensure each subconcept has at least 1 integrated exercise.
- Add bridge exercises that explicitly reuse prior concepts.
- Update python.json teaching examples and pitfalls for consistency.
Exit Criteria:
- All subconcepts have complete ladders and at least one bridge.

### Phase 4: Exercise Refactor and Expansion
Deliverables:
- Updated YAMLs with unified narrative prompts and cleaned objectives.
- Rebalanced dynamic/static mix where repetition is highest.
- New integrated exercises tied to the narrative.
Tasks:
- Rewrite prompts to reuse shared entities and datasets.
- Remove or merge duplicated exercises and move misplaced fundamentals.
- Expand dynamic generators for high-repetition patterns.
Exit Criteria:
- 80%+ of prompts aligned with narrative; redundancy reduced in audit.

### Phase 5: Blueprint and Skin Alignment
Deliverables:
- Blueprint beats that follow the narrative arc and reuse shared entities.
- Skin mapping that preserves the base narrative without losing clarity.
Tasks:
- Align integrated exercises to blueprint beats for each concept cluster.
- Update beat ordering to mirror the ladder progression.
- Ensure ContextHint reinforces the base narrative and skin.
Exit Criteria:
- Each blueprint reads like a cohesive mini-project with clear progression.

### Phase 6: Grading Quality and Acceptance Coverage
Deliverables:
- Rubric scoring for each exercise and a remediation list.
- Improved accepted_solutions coverage for high-variance prompts.
- Construct coaching aligned with targets and two-pass grading.
Tasks:
- Score a representative sample per concept; fix low scores first.
- Add or trim accepted solutions to reduce false negatives.
- Tighten prompts to reduce ambiguity and improve determinism.
Exit Criteria:
- Average rubric score >= 32 for each concept; no critical gaps.

### Phase 7: QA, Telemetry, and Release
Deliverables:
- Validation + tests (exercise YAML, generators, grading, paths).
- Telemetry spec: time-to-correct, hint usage, retry rate per exercise.
- Release checklist and rollback plan.
Tasks:
- Run validation and targeted test suites.
- Add telemetry hooks to surface confusing exercises.
- Roll out to a subset of users or internal sessions first.
Exit Criteria:
- All tests pass; no regression in session completion or accuracy.

## Implementation Notes
- Keep YAML as the single source of truth; Obsidian docs remain generated.
- Prefer exact slug alignment with python.json to avoid graph fragmentation.
- Use consistent language in objectives to reduce perceived randomness.
- Integrated exercises should feel like real tasks, not multi-topic trivia.

## Risks and Mitigations
- Risk: narrative feels forced or repetitive -> rotate datasets across levels while keeping entity names stable.
- Risk: validation strictness blocks content updates -> allow aliases only during migration window.
- Risk: overfitting to blueprints -> keep a core ladder that works standalone.
- Risk: grading false negatives -> expand accepted_solutions and improve normalization.

## Immediate Next Steps
- Approve narrative domain and variable lexicon.
- Generate the audit report and taxonomy cleanup list.
- Start Phase 1 replacements in exercises/python/*.yaml with a controlled script.
