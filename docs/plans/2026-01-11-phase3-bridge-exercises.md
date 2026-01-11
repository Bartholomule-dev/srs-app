# Phase 3 Cross-Concept Bridge Exercises

Purpose: define integrated exercises that explicitly connect concepts using the TinyStore narrative. These are targets for Phase 4 YAML authoring.

## Bridge Principles
- Each bridge should reinforce at least one prerequisite concept while advancing a new concept.
- Use TinyStore datasets and variable lexicon (customers, products, orders, inventory, logs).
- Prefer integrated level for the destination subconcept; include explicit re-use of prior constructs.

## Coverage Notes
- The ladder map highlights practice/edge gaps as well as integrated gaps.
- This bridge list focuses on integrated coverage; practice/edge gaps stay in the Phase 4 backlog.
- Classes and arguments still need practice/edge rungs beyond these bridges.

## Acceptance Criteria (Bridge Exercise Done)
- Level: integrated for the destination subconcept.
- Reuses at least one prerequisite construct explicitly (loop, comprehension, conditional, etc.).
- Uses TinyStore lexicon and dataset references (customers, products, orders, inventory, logs).
- Includes accepted solutions and hints; predict exercises must define grading_strategy.
- If dynamic, params validate and generate deterministic outputs.

## Generator Guidance
- Prefer dynamic for parameterizable patterns (thresholds, IDs, short lists).
- Keep static when the narrative or multi-step logic would become unclear.
- Default dataset sizes: small for predict, medium for integrated loops, large only when scale is the point.

## Priority Rubric
- P0: closes a missing integrated gap for a core subconcept.
- P1: strengthens transfer but does not close a gap.
- P2: optional/bonus.

## Bridge Targets (Prioritized)
| ID | Target | Destination subconcept | Concepts bridged | Narrative | Dynamic? | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | orders-parse-to-records | dicts | strings → collections | parse orders.csv lines into list of dicts | maybe | P1 |
| 2 | product-tags-to-set | sets | strings → collections | split a tag string into a unique set | yes | P0 |
| 3 | inventory-reorder-loop | for | collections → loops | collect products below reorder_level | no | P1 |
| 4 | orders-total-accumulator | iteration | collections → loops | sum order totals and count entries | yes | P0 |
| 5 | high-value-orders-comp | list-comp | loops → comprehensions | filter orders above threshold | yes | P1 |
| 6 | inventory-dict-comp | dict-comp | loops → comprehensions | build product_id -> on_hand dict | yes | P0 |
| 7 | discount-tier-elif | elif-chains | numbers → conditionals | assign tier based on order_total | yes | P0 |
| 8 | order-status-ternary | ternary | booleans → conditionals | one-line label for paid flag | yes | P0 |
| 9 | validate-order-status | raising | conditionals → error-handling | raise if status not allowed | yes | P0 |
| 10 | parse-quantity-safe | try-except | conversion → error-handling | parse qty with fallback | yes | P1 |
| 11 | order-total-method | methods | functions → oop | move compute_total into Order method | no | P0 |
| 12 | inventory-item-class | classes | functions → oop | define InventoryItem helper class | no | P0 |
| 13 | parse-events-log | reading | modules-files → strings | filter events.log by level | maybe | P1 |
| 14 | export-orders-csv | writing | modules-files → strings | write order records as CSV lines | maybe | P1 |
| 15 | summarize-customers | fn-basics | collections → functions | count active customers | yes | P1 |
| 16 | apply-coupon | arguments | collections → functions | apply coupon pct from dict | yes | P0 |
| 17 | process-orders-with-guard | finally | loops → error-handling | always release lock in finally | no | P0 |
| 18 | filter-orders-fn | lambda | comprehensions → functions | list-comp plus lambda sort | maybe | P1 |

## Next Phase Hooks
- Add P0 bridges first in Phase 4 YAML authoring.
- Use `docs/plans/2026-01-11-phase3-subconcept-ladders.md` to seed practice/edge backlog items.
