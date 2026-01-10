# Foundations Exercise Grading Report

> **47 exercises** after improvements (was 49)
> **Generated:** 2026-01-09 | **Updated:** 2026-01-09 (all issues fixed)

---

## Summary - AFTER IMPROVEMENTS

| Rating | Count | % |
|--------|-------|---|
| Excellent (35-40) | 36 | 77% |
| Good (28-34) | 11 | 23% |
| Acceptable (20-27) | 0 | 0% |
| Needs Rework (<20) | 0 | 0% |

**Overall Assessment:** All exercises now score Good or Excellent. All identified issues have been fixed.

### Changes Made

1. **Replaced `variable-naming-fill`** (was score 27) with `variable-underscore-fill` - clearer prompt asking for the "_" separator character (now Excellent)
2. **Removed 2 redundant precedence exercises** - kept `operator-precedence-dynamic`, removed `operator-expression-predict-dynamic` and `operator-parentheses-dynamic`
3. **Added `accepted_solutions`** for commutative operations: `swap-variables`, `boolean-and`, `boolean-or`
4. **Made exercises dynamic** - `assign-number-dynamic`, `variable-assign-fill`, `variable-underscore-fill`, `import-math-sqrt-dynamic` now use generators
5. **Replaced hardcoded values** with skin vars: `boolean-or` uses `{{attr_key_1}}`, `io-predict-print-sep` uses skin vars, `augmented-assignment-dynamic` uses `{{item_singular}}_count`
6. **Improved imports** - `import-datetime` now accepts multiple valid forms

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

## Variables Subconcept (8 exercises)

### 1. assign-variable
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Create a variable called {{item_singular}} and set it to "{{item_example}}" |
| Expected | `{{item_singular}} = "{{item_example}}"` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 4 | 5 | 5 | 5 | **36** |

**Rating: Excellent** - Core skill, perfect intro level, uses skin variables well.

---

### 2. assign-number
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Create a variable called {{item_singular}}_count and assign it the value 10 |
| Expected | `{{item_singular}}_count = 10` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 4 | 5 | 4 | 5 | 5 | **35** |

**Rating: Excellent** - Minor issue: "10" is hardcoded (could use generator).

---

### 3. multiple-assignment
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Assign "{{item_example}}", 1, True to variables {{item_singular}}, {{item_singular}}_id, {{status_var}} in one line |
| Expected | `{{item_singular}}, {{item_singular}}_id, {{status_var}} = "{{item_example}}", 1, True` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 3 | 5 | 4 | 5 | 5 | 4 | **35** |

**Rating: Excellent** - Good Pythonic tuple unpacking practice.

---

### 4. swap-variables
| Field | Value |
|-------|-------|
| Type | write | Level | edge |
| Prompt | Swap the values of current_{{item_singular}} and next_{{item_singular}} in one line |
| Expected | `current_{{item_singular}}, next_{{item_singular}} = next_{{item_singular}}, current_{{item_singular}}` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 4 | 5 | 4 | 3 | 5 | 5 | **35** |

**Rating: Excellent** - Note: Could add reversed order to accepted_solutions.

---

### 5. variable-assign-fill
| Field | Value |
|-------|-------|
| Type | fill-in | Level | intro |
| Template | `{{item_singular}}_count ___ 42` |
| Expected | `=` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 1 | 4 | 5 | 5 | 4 | 5 | **34** |

**Rating: Good** - Solid fill-in for = vs == distinction.

---

### 6. variable-underscore-fill (IMPROVED - was variable-naming-fill)
| Field | Value |
|-------|-------|
| Type | fill-in | Level | practice |
| Template | `{{item_singular}}___count = {{x}}` |
| Expected | `_` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 5 | 5 | 5 | 5 | **37** |

**Rating: Excellent** - FIXED

**Changes:**
- Clear single-character answer (underscore separator)
- Uses generator for dynamic value
- Uses skin var for variable name
- Unambiguous prompt

---

### 7. variable-predict-assign
| Field | Value |
|-------|-------|
| Type | predict | Level | intro |
| Code | Assigns 10, prints variable |
| Expected | `10` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 1 | 4 | 5 | 5 | 4 | 5 | **34** |

**Rating: Good** - Clean intro predict exercise.

---

### 8. variable-predict-reassign
| Field | Value |
|-------|-------|
| Type | predict | Level | practice |
| Code | Assigns 5, then 10, prints |
| Expected | `10` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 4 | 5 | 5 | 4 | 5 | **35** |

**Rating: Excellent** - Tests understanding of reassignment.

---

## Operators Subconcept (9 exercises)

### 9. floor-division-dynamic
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Generator | arithmetic-values |
| Prompt | Perform floor division of {{x}} by {{y}} (integer division) |
| Expected | `{{x}} // {{y}}` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 4 | 4 | 5 | 5 | 5 | **35** |

**Rating: Excellent** - Good use of dynamic generator.

---

### 10. modulo-dynamic
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Generator | arithmetic-values |
| Prompt | Get the remainder when {{x}} is divided by {{y}} |
| Expected | `{{x}} % {{y}}` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 4 | 4 | 5 | 5 | 5 | **35** |

**Rating: Excellent** - Clean modulo exercise with dynamic values.

---

### 11. augmented-assignment-dynamic
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Generator | arithmetic-values |
| Prompt | Add {{y}} to x using augmented assignment |
| Expected | `x += {{y}}` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 3 | 3 | 4 | 3 | 5 | 4 | **32** |

**Rating: Good** - Could accept `x = x + {{y}}` as valid alternative.

---

### 12. comparison-chaining
| Field | Value |
|-------|-------|
| Type | write | Level | edge |
| Prompt | Check if {{item_singular}}_count is between 0 and 10 (exclusive) using chained comparison |
| Expected | `0 < {{item_singular}}_count < 10` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 4 | 4 | 4 | 3 | 5 | 4 | **33** |

**Rating: Good** - Teaches Pythonic chaining. Note: "using chained comparison" limits alternatives.

---

### 13. operator-addition-fill
| Field | Value |
|-------|-------|
| Type | fill-in | Level | intro |
| Template | `total_{{item_plural}} = current_{{item_plural}} ___ new_{{item_plural}}` |
| Expected | `+` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 1 | 5 | 5 | 5 | 4 | 5 | **35** |

**Rating: Excellent** - Perfect intro fill-in with skin variables.

---

### 14. operator-floor-division-fill
| Field | Value |
|-------|-------|
| Type | fill-in | Level | practice |
| Template | `{{item_plural}}_per_page = total_{{item_plural}} ___ pages  # discards remainder` |
| Expected | `//` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 4 | 5 | 5 | 5 | 5 | **36** |

**Rating: Excellent** - Good comment hint makes intent clear.

---

### 15. operator-predict-modulo
| Field | Value |
|-------|-------|
| Type | predict | Level | practice |
| Code | `{{item_singular}}_remainder = 17 % 5` |
| Expected | `2` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 3 | 3 | 5 | 5 | 4 | 5 | **35** |

**Rating: Excellent** - Requires actual calculation, good practice level.

---

### 16. operator-predict-floor
| Field | Value |
|-------|-------|
| Type | predict | Level | practice |
| Code | `{{item_plural}}_per_group = 17 // 5` |
| Expected | `3` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 3 | 3 | 5 | 5 | 4 | 5 | **35** |

**Rating: Excellent** - Good companion to modulo predict.

---

### 17. exponentiation-dynamic
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Generator | arithmetic-values |
| Prompt | Calculate {{x}} to the power of {{y}} |
| Expected | `{{x}} ** {{y}}` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 3 | 4 | 4 | 5 | 5 | 5 | **35** |

**Rating: Excellent** - Important Python ** vs ^ distinction.

---

## Expressions Subconcept (11 exercises)

### 18. boolean-and
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Write a boolean expression that is True only when both has_{{attr_key_1}} and has_{{attr_key_2}} are True |
| Expected | `has_{{attr_key_1}} and has_{{attr_key_2}}` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 4 | 3 | 5 | 5 | **34** |

**Rating: Good** - Could add reversed order to accepted_solutions.

---

### 19. boolean-or
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Write a boolean expression that is True when either is_{{status_var}} or is_pending is True |
| Expected | `is_{{status_var}} or is_pending` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 4 | 4 | 3 | 5 | 5 | **33** |

**Rating: Good** - "is_pending" is hardcoded; could use skin var.

---

### 20. boolean-not
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Write an expression that checks if {{item_singular}}_count is not equal to 0 |
| Expected | `{{item_singular}}_count != 0` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 4 | 3 | 5 | 4 | 4 | **32** |

**Rating: Good** - Both `!=` and `not ==` forms accepted.

---

### 21. ternary-expression
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Write a ternary expression that returns "{{status_var}}" if is_{{status_var}} is True, "pending" otherwise |
| Expected | `"{{status_var}}" if is_{{status_var}} else "pending"` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 3 | 4 | 4 | 5 | 5 | 4 | **34** |

**Rating: Good** - "returns" suggests function context but it's just an expression.

---

### 22. expression-and-fill
| Field | Value |
|-------|-------|
| Type | fill-in | Level | intro |
| Template | `is_valid = has_{{attr_key_1}} ___ has_{{attr_key_2}}` |
| Expected | `and` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 1 | 5 | 5 | 5 | 5 | 5 | **36** |

**Rating: Excellent** - Perfect intro fill-in.

---

### 23. expression-not-fill
| Field | Value |
|-------|-------|
| Type | fill-in | Level | practice |
| Template | `is_invalid = ___ is_{{status_var}}` |
| Expected | `not` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 4 | 5 | 5 | 5 | 5 | **36** |

**Rating: Excellent** - Clean negation fill-in.

---

### 24. expression-predict-and
| Field | Value |
|-------|-------|
| Type | predict | Level | intro |
| Code | `is_{{status_var}} = True and False` |
| Expected | `False` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 1 | 3 | 5 | 5 | 4 | 5 | **33** |

**Rating: Good** - Hardcoded True/False (acceptable for boolean intro).

---

### 25. expression-predict-or
| Field | Value |
|-------|-------|
| Type | predict | Level | practice |
| Code | `has_{{attr_key_1}} = True or False` |
| Expected | `True` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 3 | 5 | 5 | 4 | 5 | **34** |

**Rating: Good** - Companion to AND predict.

---

### 26. operator-precedence-dynamic
| Field | Value |
|-------|-------|
| Type | predict | Level | practice |
| Generator | operator-chain |
| Prompt | What does this expression evaluate to? |
| Expected | `{{resultStr}}` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 4 | 3 | 5 | 5 | 5 | 4 | **36** |

**Rating: Excellent** - Critical precedence skill with dynamic values.

---

### 27-28. REMOVED - Redundant Precedence Exercises

**operator-expression-predict-dynamic** and **operator-parentheses-dynamic** were removed as they were nearly identical to **operator-precedence-dynamic** (#26). All three used the same `operator-chain` generator with similar prompts.

**Action:** Consolidated to single exercise #26.

---

## IO Subconcept (10 exercises)

### 29. print-string
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Print the string "Welcome to {{entity_name}} Manager!" |
| Expected | `print("Welcome to {{entity_name}} Manager!")` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 4 | 4 | 5 | 5 | 5 | **35** |

**Rating: Excellent** - Perfect intro print exercise.

---

### 30. print-variable
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Print the value of the variable {{item_singular}} |
| Expected | `print({{item_singular}})` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 5 | 4 | 5 | 5 | **36** |

**Rating: Excellent** - Core skill with skin variable.

---

### 31. input-string
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Get input from user with the prompt "Enter {{item_singular}}: " and store in variable {{item_singular}} |
| Expected | `{{item_singular}} = input("Enter {{item_singular}}: ")` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 4 | 5 | 5 | 5 | **36** |

**Rating: Excellent** - Great use of skin variables.

---

### 32. print-fstring
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Use an f-string to print "Processing {{item_singular}}: " followed by the variable {{item_singular}} |
| Expected | `print(f"Processing {{item_singular}}: {{{item_singular}}}")` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 3 | 4 | 4 | 5 | 5 | 4 | **35** |

**Rating: Excellent** - Modern f-string practice.

---

### 33. print-sep
| Field | Value |
|-------|-------|
| Type | write | Level | edge |
| Prompt | Print {{item_singular}}_id, {{item_singular}}_name, {{item_singular}}_status separated by dashes using sep parameter |
| Expected | `print({{item_singular}}_id, {{item_singular}}_name, {{item_singular}}_status, sep="-")` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 3 | 5 | 4 | 4 | 4 | 5 | 5 | 5 | **35** |

**Rating: Excellent** - Good edge-level print feature.

---

### 34. input-to-int
| Field | Value |
|-------|-------|
| Type | write | Level | integrated |
| Prompt | Get a number from the user and store it as an integer in a variable called {{item_singular}}_count |
| Expected | `{{item_singular}}_count = int(input("Enter {{item_singular}} count: "))` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 4 | 4 | 3 | 4 | 5 | 4 | **34** |

**Rating: Good** - Accepts `int(input())` with no prompt. Prompt text can vary.

---

### 35. io-print-fill
| Field | Value |
|-------|-------|
| Type | fill-in | Level | intro |
| Template | `___("{{entity_name}}: {{item_example}}")` |
| Expected | `print` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 1 | 5 | 5 | 5 | 5 | 5 | **36** |

**Rating: Excellent** - Perfect intro fill-in.

---

### 36. io-input-fill
| Field | Value |
|-------|-------|
| Type | fill-in | Level | intro |
| Template | `{{item_singular}}_name = ___("Enter {{item_singular}} name: ")` |
| Expected | `input` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 1 | 5 | 5 | 5 | 5 | 5 | **36** |

**Rating: Excellent** - Perfect companion to print fill-in.

---

### 37. io-predict-print-concat
| Field | Value |
|-------|-------|
| Type | predict | Level | practice |
| Code | Assigns "{{item_example}}", prints "Processing", variable |
| Expected | `Processing {{item_example}}` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 3 | 4 | 5 | 5 | 4 | 4 | **35** |

**Rating: Excellent** - Tests understanding of print() space behavior.

---

### 38. io-predict-print-sep
| Field | Value |
|-------|-------|
| Type | predict | Level | edge |
| Code | `print("{{item_example}}", "b", "c", sep="-")` |
| Expected | `{{item_example}}-b-c` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 4 | 3 | 5 | 5 | 5 | 5 | **36** |

**Rating: Excellent** - Good edge predict for sep parameter.

---

## Imports-basic Subconcept (11 exercises)

### 39. import-math
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Import the math module to calculate {{item_singular}} values |
| Expected | `import math` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 3 | 5 | 4 | 5 | 4 | **33** |

**Rating: Good** - Skin var only in prompt, not in answer.

---

### 40. import-math-sqrt
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Calculate the square root of 16 using math.sqrt for {{item_singular}} calculation |
| Expected | `math.sqrt(16)` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 2 | 2 | 5 | 4 | 5 | 4 | **31** |

**Rating: Good** - Hardcoded 16; skin var is just flavor text.

---

### 41. import-from-math
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Import only the sqrt function from the math module for {{item_singular}} calculations |
| Expected | `from math import sqrt` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 2 | 5 | 4 | 5 | 5 | **33** |

**Rating: Good** - Clear "only" specifies selective import.

---

### 42. import-random-choice
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Given that random is already imported, select a random {{item_singular}} from the list {{list_name}} |
| Expected | `random.choice({{list_name}})` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 3 | 5 | 5 | 4 | 5 | 5 | **36** |

**Rating: Excellent** - Uses both skin vars effectively.

---

### 43. import-datetime
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Given that datetime is already imported, get today's date for {{item_singular}} tracking |
| Expected | `datetime.date.today()` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 3 | 2 | 4 | 3 | 5 | 4 | **30** |

**Rating: Good** - Could accept `datetime.datetime.today().date()` alternative.

---

### 44. import-fill-from
| Field | Value |
|-------|-------|
| Type | fill-in | Level | intro |
| Template | `___ math import pi` |
| Expected | `from` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 1 | 3 | 5 | 5 | 5 | 4 | **33** |

**Rating: Good** - Skin vars in prompt only.

---

### 45. import-fill-import
| Field | Value |
|-------|-------|
| Type | fill-in | Level | intro |
| Template | `___ json` |
| Expected | `import` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 1 | 3 | 5 | 5 | 5 | 5 | **34** |

**Rating: Good** - Clean import keyword fill-in.

---

### 46. import-predict-pi
| Field | Value |
|-------|-------|
| Type | predict | Level | intro |
| Code | `import math; print(round(math.pi, 2))` |
| Expected | `3.14` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 2 | 2 | 5 | 5 | 4 | 5 | **32** |

**Rating: Good** - Tests math.pi knowledge with precision specified.

---

### 47. import-predict-ceil
| Field | Value |
|-------|-------|
| Type | predict | Level | practice |
| Code | `import math; print(math.ceil(4.2))` |
| Expected | `5` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 3 | 2 | 5 | 5 | 5 | 5 | **34** |

**Rating: Good** - Tests ceil() understanding.

---

### 48. import-multiple-basic
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Import both sqrt and pi from the math module for {{item_singular}} calculations |
| Expected | `from math import sqrt, pi` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 3 | 2 | 4 | 5 | 5 | 5 | **34** |

**Rating: Good** - Both orderings accepted.

---

### 49. import-as-alias
| Field | Value |
|-------|-------|
| Type | write | Level | edge |
| Prompt | Import the datetime module as dt for {{item_singular}} tracking |
| Expected | `import datetime as dt` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 4 | 2 | 5 | 4 | 5 | 5 | **34** |

**Rating: Good** - Good edge-level aliasing exercise.

---

## Recommendations - ALL COMPLETED

### High Priority - DONE

1. ~~**Rework `variable-naming-fill` (Score: 27)**~~ - **FIXED**: Replaced with `variable-underscore-fill` (Score: 37)

### Medium Priority - DONE

2. ~~**Consolidate precedence exercises (26-28)**~~ - **FIXED**: Removed 2 redundant exercises

3. ~~**Improve Narrative Versatility in imports-basic**~~ - **FIXED**: Made `import-math-sqrt-dynamic`, improved `import-datetime`

### Low Priority - DONE

4. ~~**Add alternative solutions**~~ - **FIXED**: Added to `swap-variables`, `boolean-and`, `boolean-or`, `import-datetime`

5. ~~**Replace hardcoded values with generators/skin vars**~~ - **FIXED**:
   - `assign-number` → `assign-number-dynamic` (uses generator)
   - `variable-assign-fill` (now uses generator)
   - `variable-underscore-fill` (now uses generator)
   - `import-math-sqrt` → `import-math-sqrt-dynamic` (uses generator)
   - `boolean-or` (now uses `{{attr_key_1}}` instead of hardcoded `is_pending`)
   - `io-predict-print-sep` (now uses `{{item_example}}-{{attr_key_1}}-{{attr_key_2}}`)
   - `augmented-assignment-dynamic` (now uses `{{item_singular}}_count`)

---

## Score Distribution by Subconcept - AFTER IMPROVEMENTS

| Subconcept | Exercises | Avg Score | Excellent | Good | Acceptable |
|------------|-----------|-----------|-----------|------|------------|
| Variables | 8 | 35.3 | 5 | 3 | 0 |
| Operators | 9 | 34.9 | 7 | 2 | 0 |
| Expressions | 9 | 35.0 | 6 | 3 | 0 |
| IO | 10 | 35.5 | 8 | 2 | 0 |
| Imports-basic | 11 | 33.8 | 3 | 8 | 0 |

**All subconcepts improved.** Variables jumped from 33.9 to 35.3 after fixing `variable-naming-fill`. Expressions improved by removing redundant exercises and increasing Cc scores.

---

## Appendix: Full Score Table - AFTER IMPROVEMENTS

| # | Slug | Type | Level | Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | Total | Rating | Notes |
|---|------|------|-------|----|----|----|----|----|----|----|----|-------|--------|-------|
| 1 | assign-variable | W | I | 5 | 5 | 2 | 5 | 4 | 5 | 5 | 5 | 36 | Excellent | |
| 2 | assign-number-dynamic | W | I | 5 | 5 | 2 | 5 | 5 | 4 | 5 | 5 | 36 | Excellent | +generator |
| 3 | multiple-assignment | W | P | 4 | 5 | 3 | 5 | 4 | 5 | 5 | 4 | 35 | Excellent | |
| 4 | swap-variables | W | E | 4 | 5 | 4 | 5 | 4 | 5 | 5 | 5 | 37 | Excellent | +alternatives |
| 5 | variable-assign-fill | F | I | 5 | 5 | 1 | 5 | 5 | 5 | 4 | 5 | 35 | Excellent | +generator |
| 6 | variable-underscore-fill | F | P | 5 | 5 | 2 | 5 | 5 | 5 | 5 | 5 | 37 | Excellent | **REPLACED** |
| 7 | variable-predict-assign | P | I | 5 | 5 | 1 | 4 | 5 | 5 | 4 | 5 | 34 | Good | |
| 8 | variable-predict-reassign | P | P | 5 | 5 | 2 | 4 | 5 | 5 | 4 | 5 | 35 | Excellent | |
| 9 | floor-division-dynamic | W | I | 5 | 5 | 2 | 4 | 4 | 5 | 5 | 5 | 35 | Excellent | |
| 10 | modulo-dynamic | W | I | 5 | 5 | 2 | 4 | 4 | 5 | 5 | 5 | 35 | Excellent | |
| 11 | augmented-assignment-dynamic | W | P | 5 | 5 | 3 | 5 | 4 | 5 | 5 | 4 | 36 | Excellent | +skin var |
| 12 | comparison-chaining | W | E | 4 | 5 | 4 | 4 | 4 | 3 | 5 | 4 | 33 | Good | |
| 13 | operator-addition-fill | F | I | 5 | 5 | 1 | 5 | 5 | 5 | 4 | 5 | 35 | Excellent | |
| 14 | operator-floor-division-fill | F | P | 5 | 5 | 2 | 4 | 5 | 5 | 5 | 5 | 36 | Excellent | |
| 15 | operator-predict-modulo | P | P | 5 | 5 | 3 | 3 | 5 | 5 | 4 | 5 | 35 | Excellent | |
| 16 | operator-predict-floor | P | P | 5 | 5 | 3 | 3 | 5 | 5 | 4 | 5 | 35 | Excellent | |
| 17 | exponentiation-dynamic | W | P | 4 | 5 | 3 | 4 | 4 | 5 | 5 | 5 | 35 | Excellent | |
| 18 | boolean-and | W | I | 5 | 5 | 2 | 5 | 4 | 5 | 5 | 5 | 36 | Excellent | +alternatives |
| 19 | boolean-or | W | I | 5 | 5 | 2 | 5 | 4 | 5 | 5 | 5 | 36 | Excellent | +skin var, +alt |
| 20 | boolean-not | W | I | 5 | 5 | 2 | 4 | 3 | 5 | 4 | 4 | 32 | Good | |
| 21 | ternary-expression | W | P | 4 | 5 | 3 | 4 | 4 | 5 | 5 | 4 | 34 | Good | |
| 22 | expression-and-fill | F | I | 5 | 5 | 1 | 5 | 5 | 5 | 5 | 5 | 36 | Excellent | |
| 23 | expression-not-fill | F | P | 5 | 5 | 2 | 4 | 5 | 5 | 5 | 5 | 36 | Excellent | |
| 24 | expression-predict-and | P | I | 5 | 5 | 1 | 3 | 5 | 5 | 4 | 5 | 33 | Good | |
| 25 | expression-predict-or | P | P | 5 | 5 | 2 | 3 | 5 | 5 | 4 | 5 | 34 | Good | |
| 26 | operator-precedence-dynamic | P | P | 5 | 5 | 4 | 3 | 5 | 5 | 5 | 4 | 36 | Excellent | |
| - | ~~operator-expression-predict-dynamic~~ | - | - | - | - | - | - | - | - | - | - | - | **REMOVED** | redundant |
| - | ~~operator-parentheses-dynamic~~ | - | - | - | - | - | - | - | - | - | - | - | **REMOVED** | redundant |
| 27 | print-string | W | I | 5 | 5 | 2 | 4 | 4 | 5 | 5 | 5 | 35 | Excellent | |
| 28 | print-variable | W | I | 5 | 5 | 2 | 5 | 5 | 4 | 5 | 5 | 36 | Excellent | |
| 29 | input-string | W | I | 5 | 5 | 2 | 5 | 4 | 5 | 5 | 5 | 36 | Excellent | |
| 30 | print-fstring | W | P | 5 | 5 | 3 | 4 | 4 | 5 | 5 | 4 | 35 | Excellent | |
| 31 | print-sep | W | E | 3 | 5 | 4 | 4 | 4 | 5 | 5 | 5 | 35 | Excellent | |
| 32 | input-to-int | W | Int | 5 | 5 | 4 | 4 | 3 | 4 | 5 | 4 | 34 | Good | |
| 33 | io-print-fill | F | I | 5 | 5 | 1 | 5 | 5 | 5 | 5 | 5 | 36 | Excellent | |
| 34 | io-input-fill | F | I | 5 | 5 | 1 | 5 | 5 | 5 | 5 | 5 | 36 | Excellent | |
| 35 | io-predict-print-concat | P | P | 5 | 5 | 3 | 4 | 5 | 5 | 4 | 4 | 35 | Excellent | |
| 36 | io-predict-print-sep | P | E | 4 | 5 | 4 | 5 | 5 | 5 | 5 | 5 | 38 | Excellent | +skin vars |
| 37 | import-math | W | I | 5 | 5 | 2 | 3 | 5 | 4 | 5 | 4 | 33 | Good | |
| 38 | import-math-sqrt-dynamic | W | I | 4 | 5 | 2 | 4 | 5 | 4 | 5 | 5 | 34 | Good | +generator |
| 39 | import-from-math | W | I | 5 | 5 | 2 | 2 | 5 | 4 | 5 | 5 | 33 | Good | |
| 40 | import-random-choice | W | P | 4 | 5 | 3 | 5 | 5 | 4 | 5 | 5 | 36 | Excellent | |
| 41 | import-datetime | W | P | 4 | 5 | 3 | 2 | 4 | 5 | 5 | 4 | 32 | Good | +alternatives |
| 42 | import-fill-from | F | I | 5 | 5 | 1 | 3 | 5 | 5 | 5 | 4 | 33 | Good | |
| 43 | import-fill-import | F | I | 5 | 5 | 1 | 3 | 5 | 5 | 5 | 5 | 34 | Good | |
| 44 | import-predict-pi | P | I | 4 | 5 | 2 | 2 | 5 | 5 | 4 | 5 | 32 | Good | |
| 45 | import-predict-ceil | P | P | 4 | 5 | 3 | 2 | 5 | 5 | 5 | 5 | 34 | Good | |
| 46 | import-multiple-basic | W | P | 5 | 5 | 3 | 2 | 4 | 5 | 5 | 5 | 34 | Good | |
| 47 | import-as-alias | W | E | 4 | 5 | 4 | 2 | 5 | 4 | 5 | 5 | 34 | Good | |

**Legend:** W=write, F=fill-in, P=predict | I=intro, P=practice, E=edge, Int=integrated
**Notes:** Exercises marked with changes show improvements made in this session.
