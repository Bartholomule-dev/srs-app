# Loops Exercise Grading Report

> **76 exercises** to review
> **Generated:** 2026-01-09

---

## Grading Summary

Overall, the loops exercises are well-designed with good use of skin variables. Most exercises score in the Good-Excellent range.

### Critical Issues Found

1. **Level mismatches:**
   - `break-statement` - marked "edge" but just asks for keyword "break" (should be intro)
   - `continue-statement` - marked "edge" but just asks for keyword "continue" (should be intro)
   - `while-loop` - marked "practice" but prompt asks for simple header (duplicates while-counter-intro)

2. **Duplicate exercises:**
   - `while-loop` duplicates `while-header-intro` and `while-counter-intro`
   - `break-statement` duplicates `break-loop` and `break-fill`
   - `continue-statement` duplicates `continue-loop` and `continue-fill`

### Exercises by Subconcept

| Subconcept | Count | Avg Score | Issues |
|------------|-------|-----------|--------|
| for | 15 | ~36 | None significant |
| while | 5 | ~34 | Level mismatch on while-loop |
| iteration | 8 | ~36 | None |
| zip | 7 | ~35 | None |
| reversed | 4 | ~35 | None |
| sorted | 6 | ~36 | None |
| any-all | 6 | ~35 | None |
| range | 7 | ~36 | None |
| break-continue | 9 | ~34 | Level issues on keyword exercises |
| conditionals (dynamic) | 6 | ~35 | These should be in conditionals.yaml |

---

## High Priority Fixes

### 1. break-statement - Level mismatch
- **Current:** level: edge
- **Issue:** Asking for just "break" keyword is intro level
- **Fix:** Change to level: intro

### 2. continue-statement - Level mismatch
- **Current:** level: edge
- **Issue:** Asking for just "continue" keyword is intro level
- **Fix:** Change to level: intro

### 3. while-loop - Level mismatch
- **Current:** level: practice
- **Issue:** Hardcoded "count < 5" header duplicates intro exercises
- **Fix:** Change to level: intro (or remove as duplicate)

---

## Sample Gradings

### for-loop-list (Excellent)
| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 2 | 5 | 3 | 5 | 5 | 5 | **35** |

Great use of skin vars ({{list_name}}, {{item_singular}}).

---

### enumerate-basic (Excellent)
| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 3 | 5 | 3 | 5 | 5 | 5 | **36** |

Multiple variable names accepted (i, idx, index).

---

### zip-unequal-lengths (Excellent)
| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 4 | 5 | 4 | 5 | 4 | 5 | 5 | 5 | **37** |

Edge case properly at edge level, uses skin vars.

---

### range-len-anti-pattern (Excellent)
| Tr | Cg | Dd | Nv | Ad | Cc | Id | Pc | **Total** |
|----|----|----|----|----|----|----|----|----|
| 5 | 5 | 4 | 4 | 5 | 5 | 5 | 5 | **38** |

Teaches Pythonic pattern, good Id score.

---

## Changes Made

### 2026-01-09 Iteration 1

1. **break-statement**: Changed level from `edge` to `intro` (Cg: 3→5)
2. **continue-statement**: Changed level from `edge` to `intro` (Cg: 3→5)
3. **while-loop**: Changed level from `practice` to `intro` (Cg: 3→5)

**Score Impact:** +6 points across 3 exercises improved.

