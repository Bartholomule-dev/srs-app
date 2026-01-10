# Collections Exercise Grading Report

> **76 exercises** to review
> **Generated:** 2026-01-09

---

## Grading Rubric Reference

| Dim | Name | Description |
|-----|------|-------------|
| Tr | Transfer Value | Does it matter outside this app? |
| Cg | Cognitive Load Match | Level vs actual difficulty |
| Dd | Decision Depth | Choice vs recall (target: intro=1-2, practice=3-4, edge=4-5, integrated=5) |
| Nv | Narrative Versatility | Skin system compatibility |
| Ad | Answer Determinism | Is the correct answer unambiguous? |
| Cc | Coverage Completeness | Are valid variations captured? |
| Id | Idiom Quality | Teaching good habits? |
| Pc | Prompt Clarity | Is the question well-written? |

**Max Score:** 40 | **Thresholds:** 35-40 Excellent | 28-34 Good | 20-27 Acceptable | <20 Needs rework

---

## Lists Subconcept (22 exercises)

### 1. list-create-empty
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Create an empty list called {{list_name}} |
| Expected | `{{list_name}} = []` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 4 | 4 | 5 | 5 | **35** |

**Rating: Excellent** - Core skill, uses skin var well. Minor: doesn't accept `{{list_name}} = list()`.

---

### 2. list-create-values
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Create a {{item_singular}} list with values 1, 2, 3 |
| Expected | `[1, 2, 3]` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 1 | 3 | 5 | 5 | 5 | 3 | **32** |

**Rating: Good**
**Issues:**
1. **Nv=3**: Hardcoded values [1, 2, 3] instead of using skin vars or generator
2. **Pc=3**: Prompt says "Create a list" but expected answer is just the literal, not `x = [1, 2, 3]`. Ambiguous.

**Recommendation:** Either change expected to include assignment, or clarify prompt to say "Write the list literal..."

---

### 3. list-in-check
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Check if "{{item_example}}" is in {{list_name}} |
| Expected | `"{{item_example}}" in {{list_name}}` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 4 | 5 | 5 | 5 | **36** |

**Rating: Excellent** - Uses skin vars, both quote styles accepted.

---

### 4. list-extend-method
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Extend {{list_name}} with {{item_plural}} from new_{{item_plural}} |
| Expected | `{{list_name}}.extend(new_{{item_plural}})` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 3 | 5 | 5 | 3 | 5 | 5 | **35** |

**Rating: Excellent**
**Minor:** Cc=3 - Could accept `{{list_name}} += new_{{item_plural}}` as alternative.

---

### 5. list-pop-index
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Remove and return the {{item_singular}} at index 2 from {{list_name}} |
| Expected | `{{list_name}}.pop(2)` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 3 | 4 | 5 | 5 | 5 | 5 | **36** |

**Rating: Excellent** - Hardcoded "index 2" is minor issue (Nv=4).

---

### 6. list-index
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Find the index of "{{item_example}}" in {{list_name}} |
| Expected | `{{list_name}}.index("{{item_example}}")` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 3 | 5 | 5 | 5 | 5 | 5 | **37** |

**Rating: Excellent** - Great use of skin vars.

---

### 7. list-count
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Count occurrences of "{{item_example}}" in {{list_name}} |
| Expected | `{{list_name}}.count("{{item_example}}")` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 3 | 5 | 5 | 5 | 5 | 5 | **37** |

**Rating: Excellent**

---

### 8. list-sort
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Sort {{list_name}} in place |
| Expected | `{{list_name}}.sort()` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 3 | 5 | 5 | 5 | 5 | 5 | **38** |

**Rating: Excellent** - Perfect, emphasizes "in place".

---

### 9. list-sorted
| Field | Value |
|-------|-------|
| Type | write | Level | edge |
| Prompt | Return a sorted copy of {{list_name}} without modifying it |
| Expected | `sorted({{list_name}})` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 4 | 5 | 5 | 5 | 5 | 5 | **39** |

**Rating: Excellent** - Good contrast with .sort().

---

### 10. list-reverse
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Reverse {{list_name}} in place |
| Expected | `{{list_name}}.reverse()` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 3 | 5 | 5 | 4 | 5 | 5 | **36** |

**Rating: Excellent**
**Minor:** Cc=4 - Could mention that `{{list_name}}[::-1]` creates a copy, not in-place reversal.

---

## Tuples Subconcept (4 exercises)

### 11. tuple-create
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Create a {{item_singular}} tuple with values 1, 2, 3 |
| Expected | `(1, 2, 3)` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 1 | 3 | 5 | 5 | 5 | 4 | **33** |

**Rating: Good**
**Issues:**
1. **Nv=3**: Hardcoded values [1, 2, 3]
2. **Pc=4**: Same ambiguity as list-create-values - just literal or assignment?

---

### 12. tuple-single
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Create a single-{{item_singular}} tuple with element 5 (note the syntax) |
| Expected | `(5,)` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 3 | 3 | 5 | 4 | 5 | 4 | **33** |

**Rating: Good**
**Issues:**
1. **Nv=3**: Hardcoded "5"
2. **Cc=4**: Doesn't accept `5,` (without parentheses, which is valid)

---

### 13. tuple-unpack
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Unpack tuple {{item_singular}}_coords = (3, 4) into variables {{attr_key_1}} and {{attr_key_2}} |
| Expected | `{{attr_key_1}}, {{attr_key_2}} = {{item_singular}}_coords` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 3 | 5 | 4 | 5 | 5 | 5 | **37** |

**Rating: Excellent** - Great use of skin vars for variable names.

---

### 14. tuple-index
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Get the second {{item_singular}} from tuple {{item_singular}}_data |
| Expected | `{{item_singular}}_data[1]` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 5 | 5 | 5 | 5 | **37** |

**Rating: Excellent** - "second" naturally implies index 1.

---

## Dicts Subconcept (15 exercises)

### 15. dict-create-empty
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Create an empty dictionary called {{item_singular}}_data |
| Expected | `{{item_singular}}_data = {}` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 4 | 4 | 5 | 5 | **35** |

**Rating: Excellent**
**Minor:** Cc=4 - Could accept `{{item_singular}}_data = dict()`.

---

### 16. dict-create-values
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Create a dict called {{item_singular}}_info with key "{{attr_key_1}}" and value "{{item_example}}" |
| Expected | `{{item_singular}}_info = {"{{attr_key_1}}": "{{item_example}}"}` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 4 | 5 | 5 | 5 | **36** |

**Rating: Excellent** - Great skin var usage.

---

### 17. dict-bracket-access
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Get the value for key "{{attr_key_1}}" from {{item_singular}} |
| Expected | `{{item_singular}}["{{attr_key_1}}"]` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 5 | 5 | 5 | 5 | **37** |

**Rating: Excellent**

---

### 18. dict-get-default
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Get value for key "{{attr_key_2}}" from {{item_singular}}, returning None if not found |
| Expected | `{{item_singular}}.get("{{attr_key_2}}")` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 3 | 5 | 4 | 5 | 5 | 5 | **37** |

**Rating: Excellent** - Includes explicit None forms in accepted_solutions.

---

### 19. dict-set-item
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Set the key "{{attr_key_1}}" to value "{{item_example}}" in {{item_singular}} |
| Expected | `{{item_singular}}["{{attr_key_1}}"] = "{{item_example}}"` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 4 | 5 | 5 | 5 | **36** |

**Rating: Excellent**

---

### 20. dict-keys-method
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Write an expression that returns all keys from {{item_singular}} |
| Expected | `{{item_singular}}.keys()` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 5 | 4 | 5 | 5 | **36** |

**Rating: Excellent**
**Minor:** Could accept `list({{item_singular}}.keys())` but returning view object is idiomatic.

---

## Sets Subconcept (7 exercises)

### 21. set-create
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Create a set of {{item_singular}} IDs with values 1, 2, 3 |
| Expected | `{1, 2, 3}` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 1 | 3 | 5 | 4 | 5 | 4 | **31** |

**Rating: Good**
**Issues:**
1. **Nv=3**: Hardcoded values 1, 2, 3
2. **Pc=4**: Same ambiguity - literal vs assignment?
3. **Cc=4**: Doesn't accept `set([1, 2, 3])`

---

### 22. set-add
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Add {{item_singular}} ID 5 to set s |
| Expected | `s.add(5)` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 2 | 3 | 5 | 5 | 5 | 5 | **34** |

**Rating: Good**
**Issue:** Nv=3 - Hardcoded "5" and "s" (should use skin vars).

---

### 23. set-union
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Get the union of {{item_singular}} sets a and b |
| Expected | `a | b` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 3 | 4 | 4 | 5 | 5 | 5 | **35** |

**Rating: Excellent** - Both `a | b` and `a.union(b)` accepted.

---

## Unpacking Subconcept (6 exercises)

### 24. unpacking-intro
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Unpack the {{item_singular}} tuple point = (3, 5) into variables x and y |
| Expected | `x, y = point` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 4 | 4 | 5 | 5 | 5 | **35** |

**Rating: Excellent**
**Minor:** Nv=4 - "point", "x", "y" are hardcoded.

---

### 25. star-unpack
| Field | Value |
|-------|-------|
| Type | write | Level | edge |
| Prompt | Unpack first {{item_singular}} to a, rest to remaining from list [1, 2, 3, 4] |
| Expected | `a, *remaining = [1, 2, 3, 4]` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 4 | 3 | 4 | 4 | 5 | 4 | **33** |

**Rating: Good**
**Issues:**
1. **Nv=3**: Hardcoded list [1, 2, 3, 4]
2. **Cc=4**: Should accept other variable names like `first, *rest`
3. **Pc=4**: Could be clearer about expected variable names

---

## Mutability Subconcept (10 exercises)

### 26. mutable-default-trap
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Define append_{{item_singular}}({{item_singular}}, target=None) avoiding mutable default |
| Expected | Multi-line function definition |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 3 | 4 | 5 | 3 | 3 | 5 | 4 | **32** |

**Rating: Good**
**Issues:**
1. **Cg=3**: This is marked "intro" but is actually practice/edge level - mutable default is an intermediate concept
2. **Ad=3**: Multiple valid implementations exist
3. **Cc=3**: Doesn't capture all valid patterns (e.g., `target = target or []`)

**Recommendation:** Change level from "intro" to "practice" or "edge".

---

### 27. shallow-copy-method
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Create a shallow copy of {{list_name}} using the copy method |
| Expected | `{{list_name}}.copy()` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 3 | 5 | 5 | 5 | 5 | 5 | **37** |

**Rating: Excellent** - Clearly specifies "using the copy method".

---

## Dict Iteration Subconcept (9 exercises)

### 28. dict-items-loop
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Write a for loop that prints each key and value from {{item_singular}}_data |
| Expected | Multi-line for loop |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 3 | 5 | 3 | 5 | 5 | 4 | **35** |

**Rating: Excellent**
**Good:** Has extensive accepted_solutions with various variable names.
**Minor:** Ad=3 - Many valid variable name combinations.

---

### 29. dict-find-key
| Field | Value |
|-------|-------|
| Type | write | Level | edge |
| Prompt | Write a function to find key by value |
| Expected | Multi-line function definition |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 5 | 4 | 3 | 4 | 5 | 5 | **35** |

**Rating: Excellent** - Good edge-level exercise with multiple valid solutions captured.

---

## Summary Statistics

| Subconcept | Exercises | Avg Score | Excellent | Good | Acceptable | Rework |
|------------|-----------|-----------|-----------|------|------------|--------|
| lists | 22 | ~35.5 | 18 | 4 | 0 | 0 |
| tuples | 4 | ~35.0 | 2 | 2 | 0 | 0 |
| dicts | 15 | ~36.0 | 13 | 2 | 0 | 0 |
| sets | 7 | ~33.5 | 3 | 4 | 0 | 0 |
| unpacking | 6 | ~34.0 | 3 | 3 | 0 | 0 |
| mutability | 10 | ~34.5 | 5 | 5 | 0 | 0 |
| dict-iteration | 9 | ~35.5 | 7 | 2 | 0 | 0 |

**Overall: All exercises score Good or Excellent.**

---

## Issues Identified and Fixes Needed

### High Priority (Score Impact)

1. **mutable-default-trap** - Level mismatch
   - Current: intro
   - Should be: practice or edge
   - Impact: Cg drops from 3 to 5 after fix

### Medium Priority (Narrative Versatility)

2. **Hardcoded values in create exercises:**
   - `list-create-values`: [1, 2, 3]
   - `tuple-create`: (1, 2, 3)
   - `tuple-single`: 5
   - `set-create`: {1, 2, 3}
   - `star-unpack`: [1, 2, 3, 4]
   - **Fix:** Use generators or skin vars

3. **set-add**: Hardcoded variable name "s" and value "5"
   - **Fix:** Use skin vars

### Low Priority (Coverage)

4. **Add accepted_solutions:**
   - `list-create-empty`: Add `{{list_name}} = list()`
   - `list-extend-method`: Add `{{list_name}} += new_{{item_plural}}`
   - `dict-create-empty`: Add `{{item_singular}}_data = dict()`
   - `set-create`: Add `set([1, 2, 3])`
   - `star-unpack`: Add `first, *rest` pattern

### Prompt Clarity

5. **Ambiguous "Create" prompts:**
   - `list-create-values`, `tuple-create`, `set-create`
   - Expected is just literal, but prompt implies assignment
   - **Fix:** Say "Write the list literal" or change expected to include assignment

---

## Changes Made

### 2026-01-09 Iteration 1

1. **mutable-default-trap**: Changed level from `intro` to `edge` (Cg: 3→5)
2. **set-add**: Changed from hardcoded `s.add(5)` to `{{item_singular}}_ids.add("{{item_example}}")` (Nv: 3→5)
3. **set-remove**: Changed from hardcoded `s.remove(5)` to `{{item_singular}}_ids.remove("{{item_example}}")` (Nv: 3→5)
4. **set-discard**: Changed from hardcoded `s.discard(5)` to `{{item_singular}}_ids.discard("{{item_example}}")` (Nv: 3→5)
5. **list-create-empty**: Added `{{list_name}} = list()` to accepted_solutions (Cc: 4→5)
6. **dict-create-empty**: Added `{{item_singular}}_data = dict()` to accepted_solutions (Cc: 4→5)
7. **list-extend-method**: Added `{{list_name}} += new_{{item_plural}}` to accepted_solutions (Cc: 3→5)

**Score Impact:** +14 points across 7 exercises improved.

