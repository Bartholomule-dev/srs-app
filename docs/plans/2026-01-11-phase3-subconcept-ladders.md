# Phase 3 Subconcept Ladder Map

Source: exercises/python/*.yaml.

Legend: intro / practice / edge / integrated counts.

## foundations

### expressions (5 / 4 / 0 / 0)
Missing: edge, integrated
- intro: boolean-and, boolean-or, boolean-not, expression-and-fill, expression-predict-and
- practice: ternary-expression, expression-not-fill, expression-predict-or, operator-precedence-dynamic
- edge: (none)
- integrated: (none)

### imports-basic (6 / 4 / 1 / 0)
Missing: integrated
- intro: import-math, import-math-sqrt-dynamic, import-from-math, import-fill-from, import-fill-import, import-predict-pi
- practice: import-random-choice, import-datetime, import-predict-ceil, import-multiple-basic
- edge: import-as-alias
- integrated: (none)

### io (5 / 2 / 2 / 1)
- intro: print-string, print-variable, input-string, io-print-fill, io-input-fill
- practice: print-fstring, io-predict-print-concat
- edge: print-sep, io-predict-print-sep
- integrated: input-to-int

### operators (3 / 6 / 0 / 0)
Missing: edge, integrated
- intro: floor-division-dynamic, modulo-dynamic, operator-addition-fill
- practice: augmented-assignment-dynamic, comparison-chaining, operator-floor-division-fill, operator-predict-modulo, operator-predict-floor, exponentiation-dynamic
- edge: (none)
- integrated: (none)

### variables (4 / 4 / 0 / 0)
Missing: edge, integrated
- intro: assign-variable, assign-number-dynamic, variable-assign-fill, variable-predict-assign
- practice: multiple-assignment, swap-variables, variable-underscore-fill, variable-predict-reassign
- edge: (none)
- integrated: (none)

## strings

### basics (6 / 1 / 0 / 0)
Missing: edge, integrated
- intro: string-concatenate, string-repeat, string-length, string-len-fill, string-concat-fill, string-predict-len
- practice: string-predict-concat
- edge: (none)
- integrated: (none)

### fstrings (2 / 7 / 2 / 1)
- intro: fstring-basic-fill, fstring-predict-basic
- practice: fstring-variable-dynamic, f-string-basic, fstring-expression, fstring-expression-fill, fstring-predict-expr, fstring-greeting-dynamic, fstring-write-dynamic
- edge: fstring-format-number, fstring-padding
- integrated: fstring-from-dict

### indexing (4 / 3 / 0 / 0)
Missing: edge, integrated
- intro: string-index-dynamic, string-negative-index, string-index-first-fill, string-predict-index
- practice: string-second-last, string-index-last-fill, string-predict-negative
- edge: (none)
- integrated: (none)

### slicing (4 / 8 / 1 / 0)
Missing: integrated
- intro: string-slice-start, string-slice-end, string-slice-start-fill, string-predict-slice
- practice: string-slicing-dynamic, string-slice-step-dynamic, string-slice-from-end-dynamic, string-reverse, string-every-other, string-slice-end-fill, string-predict-reverse, string-slice-advanced-dynamic
- edge: string-reverse-dynamic
- integrated: (none)

### string-methods (6 / 7 / 0 / 2)
Missing: edge
- intro: string-upper, string-lower, string-strip, string-upper-fill, string-predict-upper, string-method-dynamic
- practice: string-split, string-replace, string-join, string-find, string-startswith, string-strip-fill, string-predict-replace
- edge: (none)
- integrated: string-split-filter, string-join-transformed

## numbers-booleans

### booleans (2 / 3 / 0 / 1)
Missing: edge
- intro: bool-and-fill, bool-predict-and
- practice: bool-or-fill, bool-predict-not, bool-expr-dynamic
- edge: (none)
- integrated: boolean-all-check

### comparisons (2 / 5 / 0 / 0)
Missing: edge, integrated
- intro: comparison-predict-chain, comparison-result-dynamic
- practice: comparison-in-fill, comparison-predict-is, bool-expression-dynamic, bool-compound-dynamic, bool-logic-write-dynamic
- edge: (none)
- integrated: (none)

### conversion (2 / 4 / 0 / 0)
Missing: edge, integrated
- intro: convert-int-fill, convert-predict-int
- practice: convert-str-fill, convert-predict-bool, conversion-predict-dynamic, conversion-write-dynamic
- edge: (none)
- integrated: (none)

### floats (2 / 2 / 0 / 2)
Missing: edge
- intro: float-round-fill, float-predict-division
- practice: float-abs-fill, float-predict-round
- edge: (none)
- integrated: number-stats-from-list, number-round-format

### identity (3 / 3 / 2 / 0)
Missing: integrated
- intro: identity-is-none, identity-is-not-none, identity-fill-is
- practice: identity-vs-equality, identity-fill-is-not, identity-pythonic-none
- edge: identity-predict-small-ints, identity-trap-predict
- integrated: (none)

### integers (5 / 5 / 0 / 0)
Missing: edge, integrated
- intro: int-floor-div-fill, int-predict-floor, int-addition-dynamic, int-subtract-write-dynamic, variable-assign-dynamic
- practice: list-sum-dynamic, int-power-fill, int-predict-modulo, int-multiply-dynamic, int-modulo-dynamic
- edge: (none)
- integrated: (none)

### truthiness (5 / 4 / 0 / 0)
Missing: edge, integrated
- intro: truthiness-if-fill, truthiness-predict-empty, truthiness-intro, truthiness-empty-list, truthiness-write-if
- practice: truthiness-not-fill, truthiness-predict-zero, truthiness-predict-dynamic, truthiness-write-dynamic
- edge: (none)
- integrated: (none)

## conditionals

### elif-chains (2 / 4 / 2 / 0)
Missing: integrated
- intro: elif-grade, elif-fill
- practice: elif-http-status, elif-predict-order, elif-predict-fall-through, if-elif-else-predict-dynamic
- edge: if-elif-chain-trace-dynamic, if-else-order-trap
- integrated: (none)

### if-else (6 / 4 / 2 / 3)
- intro: if-else-basic, if-statement, if-fill-colon, if-fill-else, if-greater-dynamic, if-predict-basic
- practice: if-membership, if-not-condition, if-predict-falsy, if-bool-logic-dynamic
- edge: pythonic-if-empty-check, pythonic-none-check
- integrated: conditional-dict-validation, conditional-list-any, conditional-early-return

### match-case (2 / 2 / 1 / 0)
Missing: integrated
- intro: match-case-basic, match-case-fill
- practice: match-case-or, match-case-predict
- edge: match-case-tuple
- integrated: (none)

### ternary (2 / 3 / 1 / 0)
Missing: integrated
- intro: ternary-basic, ternary-fill
- practice: ternary-max, ternary-default, ternary-predict
- edge: ternary-nested-predict
- integrated: (none)

## collections

### dict-iteration (5 / 3 / 1 / 1)
- intro: dict-items-loop, dict-keys-loop, dict-values-loop, dict-items-fill, dict-values-fill
- practice: dict-iteration-predict, dict-items-predict, dict-sum-values
- edge: dict-find-key
- integrated: sort-dict-by-value

### dicts (9 / 6 / 0 / 2)
Missing: edge
- intro: dict-create-empty, dict-create-values, dict-bracket-access, dict-set-item, dict-keys-method, dict-values, dict-in-check, dict-brace-fill, dict-access-dynamic
- practice: dict-get-default, dict-items, dict-pop, dict-get-predict, nested-access-predict-dynamic, nested-access-write-dynamic
- edge: (none)
- integrated: list-to-dict-conversion, dict-from-parallel-lists

### lists (9 / 12 / 1 / 2)
- intro: list-create-empty, list-create-values, list-in-check, list-bracket-fill, in-operator-fill, list-append-predict, list-indexing-dynamic, list-len-dynamic, list-access-index-dynamic
- practice: list-extend-method, list-pop-index, list-index, list-count, list-sort, list-reverse, list-slice-write-dynamic, list-negative-index-dynamic, list-append-dynamic, list-pop-dynamic, list-insert-dynamic, list-method-predict-dynamic
- edge: list-sorted
- integrated: list-dedup-preserve-order, filter-list-of-dicts

### mutability (1 / 3 / 4 / 0)
Missing: integrated
- intro: list-aliasing
- practice: shallow-copy-method, shallow-copy-constructor, deep-copy
- edge: mutable-default-trap, mutate-vs-reassign, tuple-immutability, dict-mutable-values
- integrated: (none)

### sets (2 / 8 / 0 / 0)
Missing: edge, integrated
- intro: set-create, set-add
- practice: set-remove, set-discard, set-union, set-intersection, set-difference, set-union-predict, set-operation-dynamic, set-operation-write-dynamic
- edge: (none)
- integrated: (none)

### tuples (2 / 3 / 0 / 0)
Missing: edge, integrated
- intro: tuple-create, tuple-index
- practice: tuple-single, tuple-unpack, tuple-index-dynamic
- edge: (none)
- integrated: (none)

### unpacking (3 / 1 / 3 / 0)
Missing: integrated
- intro: unpacking-intro, unpacking-list-intro, unpacking-swap-intro
- practice: tuple-unpack-dynamic
- edge: star-unpack, unpack-function-args, unpack-dict-kwargs
- integrated: (none)

## loops

### any-all (2 / 3 / 1 / 0)
Missing: integrated
- intro: any-basic, all-basic
- practice: any-with-condition, any-all-predict-dynamic, any-all-write-dynamic
- edge: any-all-combined
- integrated: (none)

### break-continue (4 / 2 / 1 / 0)
Missing: integrated
- intro: break-loop, continue-loop, break-keyword-fill, continue-keyword-fill
- practice: break-output-predict, continue-output-predict
- edge: break-else
- integrated: (none)

### for (10 / 6 / 1 / 3)
- intro: for-loop-list, for-loop-string, break-statement, continue-statement, for-loop-fill, range-fill, break-fill, continue-fill, for-range-predict, for-loop-list-dynamic
- practice: for-range-step-dynamic, break-predict, continue-predict, for-sum-pair-dynamic, range-output-dynamic, for-list-total-dynamic
- edge: nested-loop-predict
- integrated: for-else, loop-dict-accumulate, loop-nested-flatten

### iteration (3 / 5 / 0 / 0)
Missing: edge, integrated
- intro: enumerate-keyword, enumerate-basic, range-intro
- practice: enumerate-loop, for-zip, enumerate-fill, enumerate-predict, enumerate-start-dynamic
- edge: (none)
- integrated: (none)

### range (2 / 3 / 1 / 0)
Missing: integrated
- intro: range-start-stop, range-function-fill
- practice: range-step, range-negative-step, range-predict
- edge: range-len-anti-pattern
- integrated: (none)

### reversed (2 / 1 / 1 / 0)
Missing: integrated
- intro: reversed-list, reversed-intro
- practice: reversed-range
- edge: reversed-enumerate
- integrated: (none)

### sorted (2 / 4 / 1 / 0)
Missing: integrated
- intro: sorted-list, sorted-intro
- practice: sorted-reverse, sorted-key-len, sorted-predict-dynamic, sorted-write-dynamic
- edge: sorted-key-lambda-tuples
- integrated: (none)

### while (4 / 2 / 1 / 0)
Missing: integrated
- intro: while-keyword, while-header-intro, while-counter-intro, while-loop
- practice: while-condition-fill, while-countdown-dynamic
- edge: while-true-break
- integrated: (none)

### zip (2 / 4 / 1 / 0)
Missing: integrated
- intro: zip-two-lists, zip-intro
- practice: zip-three-lists, zip-predict, zip-predict-dynamic, zip-sum-dynamic
- edge: zip-unequal-lengths
- integrated: (none)

## functions

### args-kwargs (2 / 4 / 1 / 0)
Missing: integrated
- intro: args-intro, kwargs-intro
- practice: args-kwargs-combined, args-syntax-fill, kwargs-syntax-fill, args-predict
- edge: args-kwargs-forward
- integrated: (none)

### arguments (3 / 0 / 3 / 0)
Missing: practice, integrated
- intro: positional-arg-intro, keyword-arg-intro, mixed-args-intro
- practice: (none)
- edge: kwargs-function, keyword-only-args, positional-only-args
- integrated: (none)

### decorators (0 / 0 / 0 / 1)
Missing: intro, practice, edge
- intro: (none)
- practice: (none)
- edge: (none)
- integrated: retry-decorator-integrated

### defaults (2 / 6 / 2 / 0)
Missing: integrated
- intro: default-param-intro, default-param-simple
- practice: default-param-multiple, default-param-none, default-value-fill, default-param-predict, default-args-predict-dynamic, default-args-call-dynamic
- edge: default-param-mutable-trap, mutable-default-predict
- integrated: (none)

### fn-basics (7 / 4 / 0 / 1)
Missing: edge
- intro: define-function, function-return, function-no-params, function-call, def-keyword-fill, return-keyword-fill, function-return-predict
- practice: function-multiple-return, function-call-dynamic, function-call-write-dynamic, function-result-predict-dynamic
- edge: (none)
- integrated: config-loader-integrated

### lambda (2 / 5 / 1 / 1)
- intro: lambda-simple, lambda-keyword-fill
- practice: lambda-two-args, lambda-predict, lambda-result-dynamic, lambda-write-dynamic, lambda-call-dynamic
- edge: lambda-conditional
- integrated: sorted-key-lambda

### scope (2 / 2 / 1 / 0)
Missing: integrated
- intro: scope-intro, scope-global-read
- practice: global-keyword, scope-predict
- edge: nonlocal-keyword
- integrated: (none)

### typehints (2 / 1 / 1 / 1)
- intro: typehint-param, typehint-return
- practice: typehint-list
- edge: typehint-optional
- integrated: typehint-callable

## comprehensions

### dict-comp (2 / 6 / 0 / 0)
Missing: edge, integrated
- intro: dict-comp-intro, dict-comp-predict-intro
- practice: dict-comp-basic, dict-comp-zip, dict-comp-colon-fill, dict-comp-predict, dict-comp-dynamic, dict-comp-write-dynamic
- edge: (none)
- integrated: (none)

### generator-exp (2 / 1 / 0 / 1)
Missing: edge
- intro: generator-exp-basic, generator-exp-intro
- practice: generator-exp-sum
- edge: (none)
- integrated: error-code-extractor-integrated

### generators (1 / 2 / 1 / 0)
Missing: integrated
- intro: generator-countdown
- practice: generator-evens, generator-predict-lazy
- edge: generator-fibonacci
- integrated: (none)

### list-comp (3 / 6 / 3 / 1)
- intro: list-comp-basic, list-comp-for-fill, list-comp-predict
- practice: list-comp-conditional, list-comp-if-fill, list-comp-filter-predict, list-comp-transform-dynamic, list-comp-filter-dynamic, list-comp-write-transform-dynamic
- edge: nested-comp, list-comp-ternary, nested-comp-predict
- integrated: active-users-integrated

### set-comp (2 / 2 / 0 / 0)
Missing: edge, integrated
- intro: set-comp-intro, set-comp-predict-intro
- practice: set-comp-basic, set-comp-brace-fill
- edge: (none)
- integrated: (none)

## error-handling

### finally (3 / 3 / 2 / 0)
Missing: integrated
- intro: finally-basic, finally-cleanup, else-clause
- practice: finally-with-except, finally-return, finally-flow-predict-dynamic
- edge: finally-exception-propagation, finally-trace-dynamic
- integrated: (none)

### raising (2 / 4 / 1 / 0)
Missing: integrated
- intro: raise-intro, raise-custom-message
- practice: raise-exception, raise-from, reraise, raise-keyword-fill
- edge: custom-exception
- integrated: (none)

### try-except (5 / 5 / 0 / 3)
Missing: edge
- intro: try-except-basic, except-specific, try-keyword-fill, except-keyword-fill, try-except-predict
- practice: except-as, except-type-predict, exception-as-predict, exception-catch-dynamic, exception-type-predict-dynamic
- edge: (none)
- integrated: error-handling-file-read, error-handling-dict-access, error-handling-conversion

## oop

### classes (4 / 0 / 0 / 0)
Missing: practice, edge, integrated
- intro: define-class, instance-attribute, class-keyword-fill, instance-attribute-predict
- practice: (none)
- edge: (none)
- integrated: (none)

### classmethod (2 / 3 / 1 / 0)
Missing: integrated
- intro: classmethod-basic, classmethod-cls-parameter
- practice: classmethod-factory, classmethod-call, staticmethod-basic
- edge: staticmethod-vs-classmethod
- integrated: (none)

### dataclasses (0 / 0 / 0 / 2)
Missing: intro, practice, edge
- intro: (none)
- practice: (none)
- edge: (none)
- integrated: api-response-model-integrated, health-check-dataclass-integrated

### inheritance (2 / 7 / 1 / 0)
Missing: integrated
- intro: inheritance-basic, inheritance-super-init
- practice: inheritance-override-method, inheritance-super-method, inheritance-isinstance, super-fill, inheritance-predict, inheritance-predict-dynamic, inheritance-override-dynamic
- edge: inheritance-issubclass
- integrated: (none)

### methods (3 / 3 / 0 / 0)
Missing: edge, integrated
- intro: init-method, instance-method, init-self-fill
- practice: method-call-predict, method-call-dynamic, instance-method-write-dynamic
- edge: (none)
- integrated: (none)

### properties (2 / 2 / 2 / 0)
Missing: integrated
- intro: property-getter, property-return
- practice: property-setter, property-setter-validation
- edge: property-deleter, property-readonly
- integrated: (none)

## modules-files

### context (2 / 2 / 0 / 0)
Missing: edge, integrated
- intro: context-manager-open, context-intro
- practice: context-manager-multiple, with-keyword-fill
- edge: (none)
- integrated: (none)

### imports (4 / 2 / 0 / 1)
Missing: edge
- intro: import-module, import-from, import-keyword-fill, from-import-fill
- practice: import-alias, import-multiple
- edge: (none)
- integrated: import-json-parse

### main-guard (2 / 1 / 1 / 0)
Missing: integrated
- intro: main-guard-basic, name-main-predict
- practice: main-guard-call-main
- edge: main-guard-with-definition
- integrated: (none)

### pathlib (2 / 7 / 1 / 0)
Missing: integrated
- intro: pathlib-create-path, pathlib-intro
- practice: pathlib-join-paths, pathlib-get-parent, path-join-predict, path-join-dynamic, path-parent-dynamic, path-stem-dynamic, path-suffix-dynamic
- edge: pathlib-check-exists
- integrated: (none)

### reading (2 / 6 / 0 / 1)
Missing: edge
- intro: file-open-read, file-read-all
- practice: file-read-lines, file-read-line, file-read-predict, file-read-dynamic, file-context-dynamic, file-write-mode-dynamic
- edge: (none)
- integrated: file-read-to-list

### writing (2 / 2 / 0 / 1)
Missing: edge
- intro: file-open-write, file-write-text
- practice: file-open-append, file-writelines
- edge: (none)
- integrated: file-write-from-list

