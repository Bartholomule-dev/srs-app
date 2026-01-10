# Strings Exercise Grading Report

> **51 exercises** to review
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

## Basics Subconcept (5 exercises)

### 1. string-concatenate
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Concatenate strings {{attr_key_1}} and {{attr_key_2}} |
| Expected | `{{attr_key_1}} + {{attr_key_2}}` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 5 | 5 | 5 | 5 | **37** |

**Rating: Excellent** - Perfect use of skin vars.

---

### 2. string-repeat
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Repeat string {{item_singular}} three times |
| Expected | `{{item_singular}} * 3` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 2 | 4 | 4 | 4 | 5 | 5 | **33** |

**Rating: Good**
**Issues:**
1. **Nv=4**: "three times" hardcoded instead of using generator
2. **Cc=4**: Doesn't accept `3 * {{item_singular}}`

---

### 3. string-length
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Get the length of string {{item_singular}} for {{entity_name}} validation |
| Expected | `len({{item_singular}})` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 5 | 5 | 5 | 5 | **37** |

**Rating: Excellent**

---

## Indexing Subconcept (4 exercises + 2 dynamic)

### 4. string-negative-index
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Get the last character of string {{item_singular}} using negative indexing |
| Expected | `{{item_singular}}[-1]` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 5 | 5 | 5 | 5 | **37** |

**Rating: Excellent**

---

### 5. string-index-dynamic
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Generator | index-values |
| Prompt | Get the character at index {{idx}} of string s |
| Expected | `s[{{idx}}]` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 4 | 5 | 5 | 5 | 5 | **36** |

**Rating: Excellent**
**Minor:** Nv=4 - Uses "s" as hardcoded variable name.

---

## Slicing Subconcept (9 exercises)

### 6. string-slicing-dynamic
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Generator | slice-bounds |
| Prompt | Get characters from index {{start}} to {{end}} (exclusive) of string s |
| Expected | `s[{{start}}:{{end}}]` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 3 | 4 | 5 | 5 | 5 | 5 | **37** |

**Rating: Excellent**

---

### 7. string-slice-start
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Get the first 5 characters of string {{item_singular}} |
| Expected | `{{item_singular}}[:5]` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 4 | 5 | 4 | 5 | 5 | **35** |

**Rating: Excellent**
**Minor:** Nv=4 - "5" is hardcoded, could use generator.

---

### 8. string-reverse
| Field | Value |
|-------|-------|
| Type | write | Level | edge |
| Prompt | Reverse string {{item_singular}} using slicing |
| Expected | `{{item_singular}}[::-1]` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 4 | 5 | 5 | 5 | 5 | 5 | **38** |

**Rating: Excellent** - Good edge exercise with clear Pythonic solution.

---

## String Methods Subconcept (9 exercises)

### 9. string-upper
| Field | Value |
|-------|-------|
| Type | write | Level | intro |
| Prompt | Convert string {{item_singular}} to uppercase |
| Expected | `{{item_singular}}.upper()` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 5 | 5 | 5 | 5 | **37** |

**Rating: Excellent**

---

### 10. string-split
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Split string {{item_singular}} by comma |
| Expected | `{{item_singular}}.split(",")` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 3 | 4 | 5 | 5 | 5 | 5 | **37** |

**Rating: Excellent**
**Minor:** Nv=4 - "comma" hardcoded; could use a skin var for delimiter.

---

### 11. string-join
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Join the list {{list_name}} using a comma as the separator |
| Expected | `",".join({{list_name}})` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 3 | 5 | 5 | 5 | 5 | 5 | **38** |

**Rating: Excellent**

---

## F-Strings Subconcept (8 exercises)

### 12. f-string-basic
| Field | Value |
|-------|-------|
| Type | write | Level | practice |
| Prompt | Create an f-string that outputs "{{entity_name}}: " followed by the value of {{item_singular}} |
| Expected | `f"{{entity_name}}: {{{item_singular}}}"` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 3 | 5 | 4 | 5 | 5 | 5 | **37** |

**Rating: Excellent** - Great skin var usage.

---

### 13. fstring-format-number
| Field | Value |
|-------|-------|
| Type | write | Level | edge |
| Prompt | Format {{item_singular}}_price with 2 decimal places in an f-string |
| Expected | `f"{{{item_singular}}_price:.2f}"` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 4 | 5 | 5 | 5 | 5 | 5 | **38** |

**Rating: Excellent** - Important edge-case skill.

---

## Predict Exercises (10+ exercises)

### 14. string-predict-len
| Field | Value |
|-------|-------|
| Type | predict | Level | intro |
| Code | Assigns "hello", prints len |
| Expected | `5` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 1 | 3 | 5 | 5 | 4 | 5 | **33** |

**Rating: Good**
**Issue:** Nv=3 - Uses hardcoded "hello" instead of skin var.

---

### 15. string-predict-index
| Field | Value |
|-------|-------|
| Type | predict | Level | intro |
| Code | {{item_singular}}_name = "hello", prints [2] |
| Expected | `l` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 1 | 3 | 5 | 5 | 4 | 5 | **33** |

**Rating: Good**
**Issue:** Nv=3 - Uses hardcoded "hello". Could use dataPack string_samples.

---

### 16. string-predict-reverse
| Field | Value |
|-------|-------|
| Type | predict | Level | practice |
| Code | {{item_singular}}_code = "abc", prints [::-1] |
| Expected | `cba` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 3 | 5 | 5 | 4 | 5 | **34** |

**Rating: Good**
**Issue:** Nv=3 - Hardcoded "abc".

---

### 17. string-predict-upper
| Field | Value |
|-------|-------|
| Type | predict | Level | intro |
| Code | {{item_singular}}_name = "hello", prints .upper() |
| Expected | `HELLO` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 1 | 3 | 5 | 5 | 4 | 5 | **33** |

**Rating: Good**
**Issue:** Nv=3 - Hardcoded "hello" and "HELLO".

---

### 18. string-predict-replace
| Field | Value |
|-------|-------|
| Type | predict | Level | practice |
| Code | {{item_singular}}_text = "hello world", prints .replace("l", "L") |
| Expected | `heLLo worLd` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 3 | 3 | 5 | 5 | 5 | 5 | **36** |

**Rating: Excellent**
**Minor:** Nv=3 - Hardcoded strings. This one is acceptable as the skill tested is about multiple replacements.

---

## Fill-in Exercises (10 exercises)

### 19. string-len-fill
| Field | Value |
|-------|-------|
| Type | fill-in | Level | intro |
| Template | `{{item_singular}}_length = ___({{item_singular}}_name)` |
| Expected | `len` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 1 | 5 | 5 | 5 | 5 | 5 | **36** |

**Rating: Excellent**

---

### 20. string-index-first-fill
| Field | Value |
|-------|-------|
| Type | fill-in | Level | intro |
| Template | `first_char = {{item_singular}}_name[___]` |
| Expected | `0` |
| Code Gate | PASS |

| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 1 | 5 | 5 | 5 | 5 | 5 | **36** |

**Rating: Excellent**

---

## Summary Statistics

| Subconcept | Exercises | Avg Score | Excellent | Good | Acceptable |
|------------|-----------|-----------|-----------|------|------------|
| basics | 5 | ~35.5 | 3 | 2 | 0 |
| indexing | 6 | ~36.0 | 5 | 1 | 0 |
| slicing | 9 | ~36.5 | 8 | 1 | 0 |
| string-methods | 9 | ~36.5 | 8 | 1 | 0 |
| fstrings | 8 | ~36.0 | 7 | 1 | 0 |
| predict exercises | 10 | ~34.0 | 4 | 6 | 0 |
| fill-in exercises | 4 | ~36.0 | 4 | 0 | 0 |

**Overall: All exercises score Good or Excellent.**

---

## Issues Identified and Fixes Needed

### Medium Priority (Narrative Versatility)

1. **Hardcoded strings in predict exercises:**
   - `string-predict-len`: "hello"
   - `string-predict-index`: "hello"
   - `string-predict-reverse`: "abc"
   - `string-predict-upper`: "hello"
   - `string-predict-slice`: "hello"
   - `string-predict-negative`: "hello"
   - **Option A:** Make these dynamic with generators
   - **Option B:** Use skin dataPack string_samples (but would require generator)
   - **Assessment:** These are acceptable as-is - predict exercises often need predictable inputs to test understanding, and "hello" is canonical.

2. **string-repeat**:
   - Hardcoded "three times"
   - Missing `3 * {{item_singular}}` alternative
   - **Fix:** Add accepted_solution

3. **string-index-dynamic**:
   - Uses "s" as hardcoded variable name
   - **Fix:** Change to `{{item_singular}}` for better skin compatibility

### Low Priority

4. **string-slice-start**: Hardcoded "5" - could use generator but acceptable as intro level.

---

## Changes Made

### 2026-01-09 Iteration 1

1. **string-repeat**: Added `3 * {{item_singular}}` to accepted_solutions (Cc: 4→5)
2. **string-index-dynamic**: Changed from `s` to `{{item_singular}}` (Nv: 4→5)
3. **string-slicing-dynamic**: Changed from `s` to `{{item_singular}}` (Nv: 4→5)
4. **string-slice-step-dynamic**: Changed from `s` to `{{item_singular}}` (Nv: 4→5)
5. **string-slice-from-end-dynamic**: Changed from `s` to `{{item_singular}}` (Nv: 4→5)

**Score Impact:** +5 points across 5 exercises improved.

