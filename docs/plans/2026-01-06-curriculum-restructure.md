# Curriculum Restructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure exercise files to match curriculum graph concepts exactly, eliminate redundancy, and establish foundation for content expansion.

**Architecture:** 10 YAML files matching 10 curriculum concepts. Each file is the single source of truth for its concept. Import script already loads all YAML files dynamically - no code changes needed for file renames.

**Tech Stack:** YAML exercise files, TypeScript import script, Supabase database

**Review Notes (Codex + Gemini):**
- DELETE basics.yaml and operators.yaml instead of merging (content already exists in foundations.yaml)
- UPDATE prereqs fields after file renames (grep for old concept names)
- MOVE misplaced exercises to their correct files, don't delete them
- EXPAND variety to ALL concepts, not just 3

---

## Phase 1: Structural Cleanup

### Task 1.1: Rename loops.yaml to control-flow.yaml

**Files:**
- Rename: `exercises/python/loops.yaml` → `exercises/python/control-flow.yaml`
- Modify: `exercises/python/control-flow.yaml` (update category header)

**Step 1: Rename the file**

```bash
cd /home/brett/Documents/Work/srs-app/exercises/python
mv loops.yaml control-flow.yaml
```

**Step 2: Update the category header**

In `control-flow.yaml`, change line 3:
```yaml
# Before
category: loops

# After
category: control-flow
```

**Step 3: Verify file exists and header is correct**

```bash
head -5 control-flow.yaml
```

Expected output includes `category: control-flow`

**Step 4: Commit**

```bash
git add exercises/python/
git commit -m "refactor: rename loops.yaml to control-flow.yaml"
```

---

### Task 1.2: Rename classes.yaml to oop.yaml

**Files:**
- Rename: `exercises/python/classes.yaml` → `exercises/python/oop.yaml`
- Modify: `exercises/python/oop.yaml` (update category header)

**Step 1: Rename the file**

```bash
cd /home/brett/Documents/Work/srs-app/exercises/python
mv classes.yaml oop.yaml
```

**Step 2: Update the category header**

In `oop.yaml`, change line 3:
```yaml
# Before
category: classes

# After
category: oop
```

**Step 3: Verify file exists and header is correct**

```bash
head -5 oop.yaml
```

Expected output includes `category: oop`

**Step 4: Commit**

```bash
git add exercises/python/
git commit -m "refactor: rename classes.yaml to oop.yaml"
```

---

### Task 1.3: Rename exceptions.yaml to error-handling.yaml

**Files:**
- Rename: `exercises/python/exceptions.yaml` → `exercises/python/error-handling.yaml`
- Modify: `exercises/python/error-handling.yaml` (update category header)

**Step 1: Rename the file**

```bash
cd /home/brett/Documents/Work/srs-app/exercises/python
mv exceptions.yaml error-handling.yaml
```

**Step 2: Update the category header**

In `error-handling.yaml`, change line 3:
```yaml
# Before
category: exceptions

# After
category: error-handling
```

**Step 3: Verify file exists and header is correct**

```bash
head -5 error-handling.yaml
```

Expected output includes `category: error-handling`

**Step 4: Commit**

```bash
git add exercises/python/
git commit -m "refactor: rename exceptions.yaml to error-handling.yaml"
```

---

### Task 1.4: Update prereqs fields after renames

**Files:**
- Check: All `exercises/python/*.yaml` files for old concept names in prereqs

**Step 1: Search for old concept references**

```bash
cd /home/brett/Documents/Work/srs-app/exercises/python
grep -n "prereqs:.*loops\|prereqs:.*classes\|prereqs:.*exceptions" *.yaml
```

Expected: List of any files with old concept names in prereqs

**Step 2: Update any found references**

If any are found, update:
- `loops` → `control-flow`
- `classes` → `oop`
- `exceptions` → `error-handling`

**Step 3: Commit if changes made**

```bash
git add exercises/python/
git commit -m "refactor: update prereqs to use new concept slugs"
```

---

### Task 1.5: Delete basics.yaml (redundant content)

**Files:**
- Delete: `exercises/python/basics.yaml`

**Rationale (from Codex + Gemini review):** The 5 exercises in basics.yaml have equivalent content already in foundations.yaml. Similar prompts exist for Hello World, variable assignment, input, etc. Merging would create near-duplicates.

**Step 1: Verify content overlap**

```bash
cd /home/brett/Documents/Work/srs-app/exercises/python
echo "=== basics.yaml prompts ===" && grep "prompt:" basics.yaml
echo "=== Similar in foundations.yaml ===" && grep -E "prompt:.*(Hello|42|Alice|type\(|Enter name)" foundations.yaml
```

Expected: Similar prompts exist in both files

**Step 2: Delete the redundant file**

```bash
rm basics.yaml
```

**Step 3: Commit**

```bash
git add exercises/python/
git commit -m "refactor: delete redundant basics.yaml (content exists in foundations.yaml)"
```

---

### Task 1.6: Delete operators.yaml (redundant content)

**Files:**
- Delete: `exercises/python/operators.yaml`

**Rationale (from Codex + Gemini review):** The 5 exercises in operators.yaml have equivalent content already in foundations.yaml. Floor division, modulo, exponentiation exercises already exist with -intro suffix.

**Step 1: Verify content overlap**

```bash
cd /home/brett/Documents/Work/srs-app/exercises/python
echo "=== operators.yaml prompts ===" && grep "prompt:" operators.yaml
echo "=== Similar in foundations.yaml ===" && grep -E "prompt:.*(17.*5|floor|modulo|power|chain)" foundations.yaml
```

Expected: Similar prompts exist in both files

**Step 2: Delete the redundant file**

```bash
rm operators.yaml
```

**Step 3: Commit**

```bash
git add exercises/python/
git commit -m "refactor: delete redundant operators.yaml (content exists in foundations.yaml)"
```

---

### Task 1.7: Delete lists.yaml (content in collections.yaml)

**Files:**
- Delete: `exercises/python/lists.yaml`

**Rationale:** collections.yaml already has comprehensive list coverage (11 exercises). The 5 exercises in lists.yaml are basic versions of what's already there.

**Step 1: Verify collections.yaml has list coverage**

```bash
cd /home/brett/Documents/Work/srs-app/exercises/python
grep -c "subconcept: lists" collections.yaml
```

Expected: 11 or more

**Step 2: Delete the redundant file**

```bash
rm lists.yaml
```

**Step 3: Commit**

```bash
git add exercises/python/
git commit -m "refactor: delete redundant lists.yaml (content exists in collections.yaml)"
```

---

### Task 1.8: Delete dictionaries.yaml (content in collections.yaml)

**Files:**
- Delete: `exercises/python/dictionaries.yaml`

**Rationale (confirmed by both Codex and Gemini):** collections.yaml already has comprehensive dict coverage (10 exercises). Safe to delete.

**Step 1: Verify collections.yaml has dict coverage**

```bash
cd /home/brett/Documents/Work/srs-app/exercises/python
grep -c "subconcept: dicts" collections.yaml
```

Expected: 10 or more

**Step 2: Delete the redundant file**

```bash
rm dictionaries.yaml
```

**Step 3: Commit**

```bash
git add exercises/python/
git commit -m "refactor: delete redundant dictionaries.yaml (content exists in collections.yaml)"
```

---

### Task 1.9: Move misplaced numbers-booleans exercises

**Files:**
- Modify: `exercises/python/foundations.yaml` (remove 10 exercises)
- Modify: `exercises/python/numbers-booleans.yaml` (add 10 exercises)

**Step 1: Identify exercises to move**

```bash
cd /home/brett/Documents/Work/srs-app/exercises/python
grep -B5 "concept: numbers-booleans" foundations.yaml | grep "slug:"
```

Expected: ~10 slugs with truthiness/comparisons subconcepts

**Step 2: Check if numbers-booleans.yaml already has these subconcepts**

```bash
grep "subconcept: truthiness\|subconcept: comparisons" numbers-booleans.yaml | wc -l
```

If numbers-booleans.yaml already has 8+ exercises for these subconcepts, the exercises in foundations.yaml are duplicates and should be removed (not moved).

**Step 3: Remove misplaced exercises from foundations.yaml**

Remove all exercises where `concept: numbers-booleans` from foundations.yaml.

**Step 4: Verify exercise count**

```bash
grep -c "slug:" foundations.yaml
```

Expected: 36 (was 46, removed 10)

**Step 5: Commit**

```bash
git add exercises/python/
git commit -m "refactor: remove misplaced numbers-booleans exercises from foundations.yaml

These exercises had concept: numbers-booleans but were in foundations.yaml.
Numbers-booleans.yaml already has coverage for truthiness and comparisons."
```

---

### Task 1.10: Validate final structure and run import

**Files:**
- All files in `exercises/python/`

**Step 1: Verify final file list**

```bash
ls -la /home/brett/Documents/Work/srs-app/exercises/python/*.yaml
```

Expected files (10 total):
- `foundations.yaml`
- `strings.yaml`
- `numbers-booleans.yaml`
- `collections.yaml`
- `control-flow.yaml`
- `functions.yaml`
- `comprehensions.yaml`
- `error-handling.yaml`
- `oop.yaml`
- `modules-files.yaml`

**Step 2: Run the import script to validate**

```bash
cd /home/brett/Documents/Work/srs-app
pnpm db:import-exercises
```

Expected: All exercises validate and import successfully

**Step 3: Verify exercise counts per file**

```bash
cd /home/brett/Documents/Work/srs-app/exercises/python
for f in *.yaml; do echo -n "$f: "; grep -c "slug:" "$f"; done
```

**Step 4: Commit Phase 1 complete**

```bash
git add .
git commit -m "refactor: complete Phase 1 curriculum restructure

- Renamed: loops.yaml → control-flow.yaml
- Renamed: classes.yaml → oop.yaml
- Renamed: exceptions.yaml → error-handling.yaml
- Updated: prereqs fields with new concept slugs
- Deleted: basics.yaml (redundant)
- Deleted: operators.yaml (redundant)
- Deleted: lists.yaml (redundant)
- Deleted: dictionaries.yaml (redundant)
- Removed: 10 misplaced exercises from foundations.yaml

Result: 10 files matching curriculum graph concepts exactly"
```

---

## Phase 2: Gap Filling - Critical Content

### Task 2.1: Add OOP inheritance exercises

**Files:**
- Modify: `exercises/python/oop.yaml`

**Step 1: Add 6 inheritance exercises**

Append to `oop.yaml`:

```yaml
  # --- Inheritance Subconcept ---
  - slug: inheritance-basic
    objective: Create a subclass that inherits from a parent class
    title: Basic Inheritance
    difficulty: 2
    concept: oop
    subconcept: inheritance
    level: intro
    prereqs: [oop.classes]
    type: write
    pattern: definition
    prompt: Define class Student that inherits from Person
    expected_answer: "class Student(Person):"
    hints:
      - Put parent class in parentheses
    tags: [oop, inheritance, beginner]

  - slug: inheritance-super-init
    objective: Call the parent class constructor using super()
    title: Super Init
    difficulty: 2
    concept: oop
    subconcept: inheritance
    level: intro
    prereqs: [oop.inheritance]
    type: write
    pattern: invocation
    prompt: Call the parent class __init__ with name parameter using super()
    expected_answer: "super().__init__(name)"
    hints:
      - Use super() to access parent
      - Call __init__ like a method
    tags: [oop, inheritance, super]

  - slug: inheritance-override-method
    objective: Override a parent class method in a subclass
    title: Method Override
    difficulty: 2
    concept: oop
    subconcept: inheritance
    level: practice
    prereqs: [oop.inheritance]
    type: write
    pattern: definition
    prompt: Define a greet method in a subclass that overrides the parent's greet
    expected_answer: "def greet(self):"
    hints:
      - Same method name overrides parent
      - No special syntax needed
    tags: [oop, inheritance, override]

  - slug: inheritance-super-method
    objective: Extend a parent method by calling super() within the override
    title: Extend Parent Method
    difficulty: 3
    concept: oop
    subconcept: inheritance
    level: practice
    prereqs: [oop.inheritance]
    type: write
    pattern: invocation
    prompt: Call the parent's greet method from within an overriding greet method
    expected_answer: "super().greet()"
    hints:
      - Use super() to access parent method
    tags: [oop, inheritance, super]

  - slug: inheritance-isinstance
    objective: Check if an object is an instance of a class or its subclasses
    title: Check Inheritance
    difficulty: 2
    concept: oop
    subconcept: inheritance
    level: practice
    prereqs: [oop.inheritance]
    type: write
    pattern: invocation
    prompt: Check if student is an instance of Person (including subclasses)
    expected_answer: "isinstance(student, Person)"
    hints:
      - isinstance checks inheritance chain
    tags: [oop, inheritance, isinstance]

  - slug: inheritance-issubclass
    objective: Check if a class is a subclass of another class
    title: Check Subclass
    difficulty: 2
    concept: oop
    subconcept: inheritance
    level: edge
    prereqs: [oop.inheritance]
    type: write
    pattern: invocation
    prompt: Check if Student is a subclass of Person
    expected_answer: "issubclass(Student, Person)"
    hints:
      - issubclass checks class hierarchy
    tags: [oop, inheritance, issubclass]
```

**Step 2: Verify exercise count**

```bash
grep -c "slug:" oop.yaml
```

Expected: 11 (was 5, added 6)

**Step 3: Commit**

```bash
git add exercises/python/oop.yaml
git commit -m "content: add 6 inheritance exercises to oop.yaml"
```

---

### Task 2.2: Add OOP classmethod exercises

**Files:**
- Modify: `exercises/python/oop.yaml`

**Step 1: Add 6 classmethod exercises**

Append to `oop.yaml`:

```yaml
  # --- Classmethod Subconcept ---
  - slug: classmethod-basic
    objective: Define a class method using the @classmethod decorator
    title: Basic Classmethod
    difficulty: 2
    concept: oop
    subconcept: classmethod
    level: intro
    prereqs: [oop.methods]
    type: write
    pattern: definition
    prompt: Define a class method called create using @classmethod decorator
    expected_answer: |
      @classmethod
      def create(cls):
    hints:
      - Use @classmethod decorator
      - First parameter is cls, not self
    tags: [oop, classmethod, decorator]

  - slug: classmethod-cls-parameter
    objective: Use cls parameter to access class attributes
    title: Cls Parameter
    difficulty: 2
    concept: oop
    subconcept: classmethod
    level: intro
    prereqs: [oop.classmethod]
    type: write
    pattern: invocation
    prompt: Return cls.count from within a classmethod
    expected_answer: "return cls.count"
    hints:
      - cls refers to the class itself
    tags: [oop, classmethod, cls]

  - slug: classmethod-factory
    objective: Create an alternative constructor using a classmethod
    title: Factory Method
    difficulty: 3
    concept: oop
    subconcept: classmethod
    level: practice
    prereqs: [oop.classmethod]
    type: write
    pattern: definition
    prompt: Define a classmethod from_string that creates an instance from a string
    expected_answer: |
      @classmethod
      def from_string(cls, s):
          return cls(s)
    hints:
      - Call cls() to create new instance
      - Parse the string and pass to constructor
    tags: [oop, classmethod, factory]

  - slug: classmethod-call
    objective: Call a classmethod on the class itself
    title: Call Classmethod
    difficulty: 2
    concept: oop
    subconcept: classmethod
    level: practice
    prereqs: [oop.classmethod]
    type: write
    pattern: invocation
    prompt: Call the from_string classmethod on Person class with "Alice"
    expected_answer: Person.from_string("Alice")
    accepted_solutions:
      - 'Person.from_string("Alice")'
      - "Person.from_string('Alice')"
    hints:
      - Call on the class, not an instance
    tags: [oop, classmethod, call]

  - slug: staticmethod-basic
    objective: Define a static method using the @staticmethod decorator
    title: Basic Staticmethod
    difficulty: 2
    concept: oop
    subconcept: classmethod
    level: practice
    prereqs: [oop.methods]
    type: write
    pattern: definition
    prompt: Define a static method called validate using @staticmethod decorator
    expected_answer: |
      @staticmethod
      def validate(value):
    hints:
      - Use @staticmethod decorator
      - No self or cls parameter
    tags: [oop, staticmethod, decorator]

  - slug: staticmethod-vs-classmethod
    objective: Choose between staticmethod and classmethod based on need for class access
    title: Static vs Class Method
    difficulty: 3
    concept: oop
    subconcept: classmethod
    level: edge
    prereqs: [oop.classmethod]
    type: write
    pattern: definition
    prompt: Define a utility method is_valid that doesn't need self or cls
    expected_answer: |
      @staticmethod
      def is_valid(value):
    hints:
      - staticmethod when you don't need class access
      - classmethod when you need cls
    tags: [oop, staticmethod, classmethod]
```

**Step 2: Verify exercise count**

```bash
grep -c "slug:" oop.yaml
```

Expected: 17 (was 11, added 6)

**Step 3: Commit**

```bash
git add exercises/python/oop.yaml
git commit -m "content: add 6 classmethod/staticmethod exercises to oop.yaml"
```

---

### Task 2.3: Add OOP properties exercises

**Files:**
- Modify: `exercises/python/oop.yaml`

**Step 1: Add 6 properties exercises**

Append to `oop.yaml`:

```yaml
  # --- Properties Subconcept ---
  - slug: property-getter
    objective: Define a property getter using the @property decorator
    title: Property Getter
    difficulty: 2
    concept: oop
    subconcept: properties
    level: intro
    prereqs: [oop.methods]
    type: write
    pattern: definition
    prompt: Define a property called full_name using @property decorator
    expected_answer: |
      @property
      def full_name(self):
    hints:
      - Use @property decorator
      - Method becomes readable as attribute
    tags: [oop, property, getter]

  - slug: property-return
    objective: Return a computed value from a property getter
    title: Property Return Value
    difficulty: 2
    concept: oop
    subconcept: properties
    level: intro
    prereqs: [oop.properties]
    type: write
    pattern: construction
    prompt: Return first_name and last_name joined with a space from a property
    expected_answer: return f"{self.first_name} {self.last_name}"
    accepted_solutions:
      - 'return f"{self.first_name} {self.last_name}"'
      - "return self.first_name + ' ' + self.last_name"
    hints:
      - Combine the two attributes
    tags: [oop, property, computed]

  - slug: property-setter
    objective: Define a property setter using the @name.setter decorator
    title: Property Setter
    difficulty: 2
    concept: oop
    subconcept: properties
    level: practice
    prereqs: [oop.properties]
    type: write
    pattern: definition
    prompt: Define a setter for the full_name property
    expected_answer: |
      @full_name.setter
      def full_name(self, value):
    hints:
      - Use @property_name.setter
      - Same method name as getter
    tags: [oop, property, setter]

  - slug: property-setter-validation
    objective: Add validation logic inside a property setter
    title: Property Validation
    difficulty: 3
    concept: oop
    subconcept: properties
    level: practice
    prereqs: [oop.properties]
    type: write
    pattern: handling
    prompt: In a setter, raise ValueError if value is negative
    expected_answer: |
      if value < 0:
          raise ValueError("Value cannot be negative")
    hints:
      - Check condition before setting
      - Raise appropriate exception
    tags: [oop, property, validation]

  - slug: property-deleter
    objective: Define a property deleter using the @name.deleter decorator
    title: Property Deleter
    difficulty: 3
    concept: oop
    subconcept: properties
    level: edge
    prereqs: [oop.properties]
    type: write
    pattern: definition
    prompt: Define a deleter for the name property
    expected_answer: |
      @name.deleter
      def name(self):
    hints:
      - Use @property_name.deleter
      - Called when del obj.name is used
    tags: [oop, property, deleter]

  - slug: property-readonly
    objective: Create a read-only property by defining only a getter
    title: Read-Only Property
    difficulty: 2
    concept: oop
    subconcept: properties
    level: edge
    prereqs: [oop.properties]
    type: write
    pattern: definition
    prompt: Define a read-only property called age that returns self._age
    expected_answer: |
      @property
      def age(self):
          return self._age
    hints:
      - Only define getter, no setter
      - Use underscore prefix for private attribute
    tags: [oop, property, readonly]
```

**Step 2: Verify exercise count**

```bash
grep -c "slug:" oop.yaml
```

Expected: 23 (was 17, added 6)

**Step 3: Commit**

```bash
git add exercises/python/oop.yaml
git commit -m "content: add 6 properties exercises to oop.yaml"
```

---

### Task 2.4: Add error-handling finally exercises

**Files:**
- Modify: `exercises/python/error-handling.yaml`

**Step 1: Add 6 finally exercises**

Append to `error-handling.yaml`:

```yaml
  # --- Finally Subconcept ---
  - slug: finally-basic
    objective: Write a finally block that always executes
    title: Basic Finally
    difficulty: 2
    concept: error-handling
    subconcept: finally
    level: intro
    prereqs: [error-handling.try-except]
    type: write
    pattern: handling
    prompt: Write a finally block that always runs
    expected_answer: "finally:"
    hints:
      - finally runs whether exception occurs or not
    tags: [exceptions, finally, cleanup]

  - slug: finally-cleanup
    objective: Use finally to ensure cleanup code always runs
    title: Finally Cleanup
    difficulty: 2
    concept: error-handling
    subconcept: finally
    level: intro
    prereqs: [error-handling.finally]
    type: write
    pattern: handling
    prompt: Close a file object f in a finally block
    expected_answer: |
      finally:
          f.close()
    hints:
      - finally ensures cleanup happens
      - Even if exception occurs
    tags: [exceptions, finally, cleanup]

  - slug: finally-with-except
    objective: Combine try, except, and finally blocks
    title: Try-Except-Finally
    difficulty: 2
    concept: error-handling
    subconcept: finally
    level: practice
    prereqs: [error-handling.finally]
    type: write
    pattern: handling
    prompt: Write a complete try-except-finally structure with pass in each block
    expected_answer: |
      try:
          pass
      except:
          pass
      finally:
          pass
    hints:
      - finally comes after except
      - All three blocks together
    tags: [exceptions, finally, complete]

  - slug: finally-return
    objective: Understand that finally runs even after return statements
    title: Finally After Return
    difficulty: 3
    concept: error-handling
    subconcept: finally
    level: practice
    prereqs: [error-handling.finally]
    type: predict
    pattern: handling
    prompt: What gets printed?
    code: |
      def test():
          try:
              return "try"
          finally:
              print("finally")
      result = test()
      print(result)
    expected_answer: |
      finally
      try
    hints:
      - finally runs before function returns
    tags: [exceptions, finally, return]

  - slug: finally-exception-propagation
    objective: Understand that finally runs even when exceptions propagate
    title: Finally With Propagation
    difficulty: 3
    concept: error-handling
    subconcept: finally
    level: edge
    prereqs: [error-handling.finally]
    type: predict
    pattern: handling
    prompt: What gets printed before the error?
    code: |
      try:
          print("try")
          raise ValueError("error")
      finally:
          print("finally")
    expected_answer: |
      try
      finally
    hints:
      - finally runs before exception propagates
    tags: [exceptions, finally, propagation]

  - slug: else-clause
    objective: Use else clause that runs when no exception occurs
    title: Try-Else Clause
    difficulty: 3
    concept: error-handling
    subconcept: finally
    level: edge
    prereqs: [error-handling.try-except]
    type: write
    pattern: handling
    prompt: Write an else block that runs when no exception is raised
    expected_answer: |
      else:
          pass
    hints:
      - else comes between except and finally
      - Runs only if no exception
    tags: [exceptions, else, control]
```

**Step 2: Verify exercise count**

```bash
grep -c "slug:" error-handling.yaml
```

Expected: 11 (was 5, added 6)

**Step 3: Commit**

```bash
git add exercises/python/error-handling.yaml
git commit -m "content: add 6 finally exercises to error-handling.yaml"
```

---

### Task 2.5: Expand error-handling with more raising exercises

**Files:**
- Modify: `exercises/python/error-handling.yaml`

**Step 1: Add 4 more raising exercises**

Append to `error-handling.yaml`:

```yaml
  # --- Additional Raising Exercises ---
  - slug: raise-custom-message
    objective: Raise an exception with a descriptive error message
    title: Raise with Message
    difficulty: 2
    concept: error-handling
    subconcept: raising
    level: intro
    prereqs: [error-handling.try-except]
    type: write
    pattern: handling
    prompt: Raise a ValueError with message "Age must be positive"
    expected_answer: raise ValueError("Age must be positive")
    accepted_solutions:
      - 'raise ValueError("Age must be positive")'
      - "raise ValueError('Age must be positive')"
    hints:
      - Pass message to exception constructor
    tags: [exceptions, raise, message]

  - slug: raise-from
    objective: Chain exceptions using raise...from to preserve context
    title: Exception Chaining
    difficulty: 3
    concept: error-handling
    subconcept: raising
    level: practice
    prereqs: [error-handling.raising]
    type: write
    pattern: handling
    prompt: Raise RuntimeError from an existing exception e
    expected_answer: raise RuntimeError("Failed") from e
    accepted_solutions:
      - 'raise RuntimeError("Failed") from e'
      - "raise RuntimeError('Failed') from e"
    hints:
      - Use 'from' to chain exceptions
      - Preserves original traceback
    tags: [exceptions, raise, chaining]

  - slug: reraise
    objective: Re-raise the current exception using bare raise
    title: Re-raise Exception
    difficulty: 2
    concept: error-handling
    subconcept: raising
    level: practice
    prereqs: [error-handling.raising]
    type: write
    pattern: handling
    prompt: Re-raise the current exception after logging it
    expected_answer: raise
    hints:
      - Bare 'raise' re-raises current exception
      - Preserves original traceback
    tags: [exceptions, raise, reraise]

  - slug: custom-exception
    objective: Define a custom exception class
    title: Custom Exception
    difficulty: 3
    concept: error-handling
    subconcept: raising
    level: edge
    prereqs: [error-handling.raising, oop.inheritance]
    type: write
    pattern: definition
    prompt: Define a custom exception class ValidationError that inherits from Exception
    expected_answer: "class ValidationError(Exception):"
    hints:
      - Inherit from Exception
      - Can add custom attributes if needed
    tags: [exceptions, custom, class]
```

**Step 2: Verify exercise count**

```bash
grep -c "slug:" error-handling.yaml
```

Expected: 15 (was 11, added 4)

**Step 3: Commit**

```bash
git add exercises/python/error-handling.yaml
git commit -m "content: add 4 more raising exercises to error-handling.yaml"
```

---

### Task 2.6: Run import and verify Phase 2 content

**Files:**
- All exercise files

**Step 1: Run the import script**

```bash
cd /home/brett/Documents/Work/srs-app
pnpm db:import-exercises
```

Expected: All exercises validate and import successfully

**Step 2: Verify new exercise counts**

```bash
cd /home/brett/Documents/Work/srs-app/exercises/python
echo "oop.yaml: $(grep -c 'slug:' oop.yaml)"
echo "error-handling.yaml: $(grep -c 'slug:' error-handling.yaml)"
```

Expected:
- oop.yaml: 23
- error-handling.yaml: 15

**Step 3: Commit Phase 2 complete**

```bash
git add .
git commit -m "content: complete Phase 2 gap filling

- OOP: Added 18 exercises (inheritance, classmethod, properties)
- Error Handling: Added 10 exercises (finally, raising)

OOP now has 23 exercises, Error Handling has 15 exercises"
```

---

## Phase 3: Balance & Polish - Exercise Variety

### Task 3.1: Add fill-in/predict to control-flow

**Files:**
- Modify: `exercises/python/control-flow.yaml`

**Step 1: Add 6 fill-in exercises**

Append to `control-flow.yaml`:

```yaml
  # --- Fill-in Exercises ---
  - slug: for-loop-fill
    objective: Complete the for loop syntax
    title: For Loop Fill-in
    difficulty: 1
    concept: control-flow
    subconcept: for
    level: intro
    prereqs: []
    type: fill-in
    pattern: iteration
    prompt: Complete the for loop to iterate over items
    template: "___ item in items:"
    expected_answer: "for"
    hints:
      - Keyword that starts iteration
    tags: [control-flow, for, fill-in]

  - slug: range-fill
    objective: Complete the range function call
    title: Range Fill-in
    difficulty: 1
    concept: control-flow
    subconcept: for
    level: intro
    prereqs: [control-flow.for]
    type: fill-in
    pattern: iteration
    prompt: Complete to loop 5 times (0 to 4)
    template: "for i in ___(5):"
    expected_answer: "range"
    hints:
      - Built-in function for number sequences
    tags: [control-flow, range, fill-in]

  - slug: enumerate-fill
    objective: Complete the enumerate function call
    title: Enumerate Fill-in
    difficulty: 2
    concept: control-flow
    subconcept: iteration
    level: practice
    prereqs: [control-flow.for]
    type: fill-in
    pattern: iteration
    prompt: Complete to get both index and value
    template: "for i, item in ___(items):"
    expected_answer: "enumerate"
    hints:
      - Function that provides index with each element
    tags: [control-flow, enumerate, fill-in]

  - slug: break-fill
    objective: Complete the loop exit keyword
    title: Break Fill-in
    difficulty: 1
    concept: control-flow
    subconcept: for
    level: intro
    prereqs: [control-flow.for]
    type: fill-in
    pattern: control
    prompt: Complete to exit the loop immediately
    template: |
      for item in items:
          if item == target:
              ___
    expected_answer: "break"
    hints:
      - Keyword to exit loop early
    tags: [control-flow, break, fill-in]

  - slug: continue-fill
    objective: Complete the skip iteration keyword
    title: Continue Fill-in
    difficulty: 1
    concept: control-flow
    subconcept: for
    level: intro
    prereqs: [control-flow.for]
    type: fill-in
    pattern: control
    prompt: Complete to skip to next iteration
    template: |
      for item in items:
          if item < 0:
              ___
    expected_answer: "continue"
    hints:
      - Keyword to skip rest of current iteration
    tags: [control-flow, continue, fill-in]

  - slug: while-condition-fill
    objective: Complete the while loop condition
    title: While Condition Fill-in
    difficulty: 2
    concept: control-flow
    subconcept: while
    level: practice
    prereqs: [control-flow.while]
    type: fill-in
    pattern: iteration
    prompt: Complete to loop while count is less than 10
    template: "while count ___ 10:"
    expected_answer: "<"
    hints:
      - Comparison operator
    tags: [control-flow, while, fill-in]
```

**Step 2: Add 6 predict exercises**

Append to `control-flow.yaml`:

```yaml
  # --- Predict Exercises ---
  - slug: for-range-predict
    objective: Predict the output of a for loop with range
    title: Range Output Predict
    difficulty: 1
    concept: control-flow
    subconcept: for
    level: intro
    prereqs: [control-flow.for]
    type: predict
    pattern: iteration
    prompt: What does this code print?
    code: |
      for i in range(3):
          print(i)
    expected_answer: |
      0
      1
      2
    hints:
      - range(3) produces 0, 1, 2
    tags: [control-flow, range, predict]

  - slug: enumerate-predict
    objective: Predict the output of enumerate
    title: Enumerate Output Predict
    difficulty: 2
    concept: control-flow
    subconcept: iteration
    level: practice
    prereqs: [control-flow.for]
    type: predict
    pattern: iteration
    prompt: What does this code print?
    code: |
      for i, ch in enumerate("abc"):
          print(i, ch)
    expected_answer: |
      0 a
      1 b
      2 c
    hints:
      - enumerate provides index and value
    tags: [control-flow, enumerate, predict]

  - slug: break-predict
    objective: Predict loop behavior with break
    title: Break Predict
    difficulty: 2
    concept: control-flow
    subconcept: for
    level: practice
    prereqs: [control-flow.for]
    type: predict
    pattern: control
    prompt: What does this code print?
    code: |
      for i in range(5):
          if i == 3:
              break
          print(i)
    expected_answer: |
      0
      1
      2
    hints:
      - break exits immediately when condition met
    tags: [control-flow, break, predict]

  - slug: continue-predict
    objective: Predict loop behavior with continue
    title: Continue Predict
    difficulty: 2
    concept: control-flow
    subconcept: for
    level: practice
    prereqs: [control-flow.for]
    type: predict
    pattern: control
    prompt: What does this code print?
    code: |
      for i in range(5):
          if i == 2:
              continue
          print(i)
    expected_answer: |
      0
      1
      3
      4
    hints:
      - continue skips current iteration only
    tags: [control-flow, continue, predict]

  - slug: zip-predict
    objective: Predict the output of zip iteration
    title: Zip Output Predict
    difficulty: 2
    concept: control-flow
    subconcept: zip
    level: practice
    prereqs: [control-flow.for]
    type: predict
    pattern: iteration
    prompt: What does this code print?
    code: |
      for a, b in zip([1, 2], ["x", "y"]):
          print(a, b)
    expected_answer: |
      1 x
      2 y
    hints:
      - zip pairs elements from both lists
    tags: [control-flow, zip, predict]

  - slug: nested-loop-predict
    objective: Predict nested loop output
    title: Nested Loop Predict
    difficulty: 3
    concept: control-flow
    subconcept: for
    level: edge
    prereqs: [control-flow.for]
    type: predict
    pattern: iteration
    prompt: What does this code print?
    code: |
      for i in range(2):
          for j in range(2):
              print(i, j)
    expected_answer: |
      0 0
      0 1
      1 0
      1 1
    hints:
      - Inner loop completes for each outer iteration
    tags: [control-flow, nested, predict]
```

**Step 3: Commit**

```bash
git add exercises/python/control-flow.yaml
git commit -m "content: add 12 fill-in/predict exercises to control-flow.yaml"
```

---

### Task 3.2: Add fill-in/predict to functions

**Files:**
- Modify: `exercises/python/functions.yaml`

**Step 1: Add 6 fill-in exercises**

Append to `functions.yaml`:

```yaml
  # --- Fill-in Exercises ---
  - slug: def-keyword-fill
    objective: Complete the function definition keyword
    title: Def Keyword Fill-in
    difficulty: 1
    concept: functions
    subconcept: basics
    level: intro
    prereqs: []
    type: fill-in
    pattern: definition
    prompt: Complete the function definition
    template: "___ greet(name):"
    expected_answer: "def"
    hints:
      - Keyword that starts function definition
    tags: [functions, def, fill-in]

  - slug: return-keyword-fill
    objective: Complete the return statement
    title: Return Fill-in
    difficulty: 1
    concept: functions
    subconcept: basics
    level: intro
    prereqs: [functions.basics]
    type: fill-in
    pattern: definition
    prompt: Complete to return the result
    template: |
      def add(a, b):
          ___ a + b
    expected_answer: "return"
    hints:
      - Keyword to send value back to caller
    tags: [functions, return, fill-in]

  - slug: lambda-keyword-fill
    objective: Complete the lambda expression
    title: Lambda Fill-in
    difficulty: 2
    concept: functions
    subconcept: lambda
    level: intro
    prereqs: [functions.basics]
    type: fill-in
    pattern: definition
    prompt: Complete the anonymous function
    template: "double = ___ x: x * 2"
    expected_answer: "lambda"
    hints:
      - Keyword for anonymous functions
    tags: [functions, lambda, fill-in]

  - slug: default-value-fill
    objective: Complete the default parameter syntax
    title: Default Value Fill-in
    difficulty: 2
    concept: functions
    subconcept: defaults
    level: practice
    prereqs: [functions.basics]
    type: fill-in
    pattern: definition
    prompt: Complete to make greeting default to "Hello"
    template: 'def greet(name, greeting___"Hello"):'
    expected_answer: "="
    hints:
      - Assignment operator for defaults
    tags: [functions, defaults, fill-in]

  - slug: args-syntax-fill
    objective: Complete the variable arguments syntax
    title: Args Syntax Fill-in
    difficulty: 2
    concept: functions
    subconcept: args-kwargs
    level: practice
    prereqs: [functions.basics]
    type: fill-in
    pattern: definition
    prompt: Complete to accept any number of arguments
    template: "def sum_all(___args):"
    expected_answer: "*"
    hints:
      - Single asterisk for positional args
    tags: [functions, args, fill-in]

  - slug: kwargs-syntax-fill
    objective: Complete the keyword arguments syntax
    title: Kwargs Syntax Fill-in
    difficulty: 2
    concept: functions
    subconcept: args-kwargs
    level: practice
    prereqs: [functions.args-kwargs]
    type: fill-in
    pattern: definition
    prompt: Complete to accept any keyword arguments
    template: "def config(___kwargs):"
    expected_answer: "**"
    hints:
      - Double asterisk for keyword args
    tags: [functions, kwargs, fill-in]
```

**Step 2: Add 6 predict exercises**

Append to `functions.yaml`:

```yaml
  # --- Predict Exercises ---
  - slug: function-return-predict
    objective: Predict function return value
    title: Return Value Predict
    difficulty: 1
    concept: functions
    subconcept: basics
    level: intro
    prereqs: [functions.basics]
    type: predict
    pattern: invocation
    prompt: What does this code print?
    code: |
      def add(a, b):
          return a + b
      print(add(3, 4))
    expected_answer: "7"
    hints:
      - Function returns sum of arguments
    tags: [functions, return, predict]

  - slug: default-param-predict
    objective: Predict behavior with default parameters
    title: Default Param Predict
    difficulty: 2
    concept: functions
    subconcept: defaults
    level: practice
    prereqs: [functions.defaults]
    type: predict
    pattern: invocation
    prompt: What does this code print?
    code: |
      def greet(name, greeting="Hello"):
          return f"{greeting}, {name}!"
      print(greet("Alice"))
    expected_answer: "Hello, Alice!"
    hints:
      - Default value is used when not provided
    tags: [functions, defaults, predict]

  - slug: lambda-predict
    objective: Predict lambda expression result
    title: Lambda Predict
    difficulty: 2
    concept: functions
    subconcept: lambda
    level: practice
    prereqs: [functions.lambda]
    type: predict
    pattern: invocation
    prompt: What does this code print?
    code: |
      double = lambda x: x * 2
      print(double(5))
    expected_answer: "10"
    hints:
      - Lambda multiplies input by 2
    tags: [functions, lambda, predict]

  - slug: scope-predict
    objective: Predict variable scope behavior
    title: Scope Predict
    difficulty: 3
    concept: functions
    subconcept: scope
    level: practice
    prereqs: [functions.scope]
    type: predict
    pattern: scope
    prompt: What does this code print?
    code: |
      x = 10
      def foo():
          x = 20
          print(x)
      foo()
      print(x)
    expected_answer: |
      20
      10
    hints:
      - Local x shadows global x inside function
    tags: [functions, scope, predict]

  - slug: args-predict
    objective: Predict *args behavior
    title: Args Predict
    difficulty: 2
    concept: functions
    subconcept: args-kwargs
    level: practice
    prereqs: [functions.args-kwargs]
    type: predict
    pattern: invocation
    prompt: What does this code print?
    code: |
      def show(*args):
          print(len(args))
      show(1, 2, 3, 4)
    expected_answer: "4"
    hints:
      - args is a tuple of all positional arguments
    tags: [functions, args, predict]

  - slug: mutable-default-predict
    objective: Predict mutable default argument bug
    title: Mutable Default Predict
    difficulty: 3
    concept: functions
    subconcept: defaults
    level: edge
    prereqs: [functions.defaults]
    type: predict
    pattern: gotcha
    prompt: What does this code print?
    code: |
      def add_item(item, items=[]):
          items.append(item)
          return items
      print(add_item(1))
      print(add_item(2))
    expected_answer: |
      [1]
      [1, 2]
    hints:
      - Mutable defaults are shared between calls
      - This is a common Python gotcha
    tags: [functions, mutable, gotcha, predict]
```

**Step 3: Commit**

```bash
git add exercises/python/functions.yaml
git commit -m "content: add 12 fill-in/predict exercises to functions.yaml"
```

---

### Task 3.3: Add fill-in/predict to comprehensions

**Files:**
- Modify: `exercises/python/comprehensions.yaml`

**Step 1: Add 4 fill-in and 4 predict exercises**

Append to `comprehensions.yaml`:

```yaml
  # --- Fill-in Exercises ---
  - slug: list-comp-for-fill
    objective: Complete list comprehension for clause
    title: List Comp For Fill-in
    difficulty: 2
    concept: comprehensions
    subconcept: list-comp
    level: intro
    prereqs: [control-flow.for]
    type: fill-in
    pattern: mapping
    prompt: Complete the list comprehension
    template: "[x * 2 ___ x in range(5)]"
    expected_answer: "for"
    hints:
      - Keyword for iteration in comprehension
    tags: [comprehensions, list-comp, fill-in]

  - slug: list-comp-if-fill
    objective: Complete list comprehension condition
    title: List Comp If Fill-in
    difficulty: 2
    concept: comprehensions
    subconcept: list-comp
    level: practice
    prereqs: [comprehensions.list-comp]
    type: fill-in
    pattern: filtering
    prompt: Complete the filter condition
    template: "[x for x in range(10) ___ x % 2 == 0]"
    expected_answer: "if"
    hints:
      - Keyword for filtering in comprehension
    tags: [comprehensions, list-comp, fill-in]

  - slug: dict-comp-colon-fill
    objective: Complete dict comprehension syntax
    title: Dict Comp Syntax Fill-in
    difficulty: 2
    concept: comprehensions
    subconcept: dict-comp
    level: practice
    prereqs: [comprehensions.list-comp]
    type: fill-in
    pattern: mapping
    prompt: Complete the key-value separator
    template: "{x ___ x**2 for x in range(3)}"
    expected_answer: ":"
    hints:
      - Separator between key and value
    tags: [comprehensions, dict-comp, fill-in]

  - slug: set-comp-brace-fill
    objective: Identify set comprehension syntax
    title: Set Comp Syntax Fill-in
    difficulty: 2
    concept: comprehensions
    subconcept: set-comp
    level: practice
    prereqs: [comprehensions.list-comp]
    type: fill-in
    pattern: mapping
    prompt: Complete to create a set (unique values)
    template: "___x for x in [1, 1, 2, 2, 3]}"
    expected_answer: "{"
    hints:
      - Same as dict but without colon
      - Creates unique values
    tags: [comprehensions, set-comp, fill-in]

  # --- Predict Exercises ---
  - slug: list-comp-predict
    objective: Predict list comprehension output
    title: List Comp Predict
    difficulty: 2
    concept: comprehensions
    subconcept: list-comp
    level: intro
    prereqs: [comprehensions.list-comp]
    type: predict
    pattern: mapping
    prompt: What does this code produce?
    code: |
      result = [x * 2 for x in range(4)]
      print(result)
    expected_answer: "[0, 2, 4, 6]"
    hints:
      - Doubles each number 0-3
    tags: [comprehensions, list-comp, predict]

  - slug: list-comp-filter-predict
    objective: Predict filtered list comprehension
    title: Filtered List Comp Predict
    difficulty: 2
    concept: comprehensions
    subconcept: list-comp
    level: practice
    prereqs: [comprehensions.list-comp]
    type: predict
    pattern: filtering
    prompt: What does this code produce?
    code: |
      result = [x for x in range(6) if x % 2 == 0]
      print(result)
    expected_answer: "[0, 2, 4]"
    hints:
      - Only includes even numbers
    tags: [comprehensions, list-comp, predict]

  - slug: dict-comp-predict
    objective: Predict dict comprehension output
    title: Dict Comp Predict
    difficulty: 2
    concept: comprehensions
    subconcept: dict-comp
    level: practice
    prereqs: [comprehensions.dict-comp]
    type: predict
    pattern: mapping
    prompt: What does this code produce?
    code: |
      result = {x: x**2 for x in range(3)}
      print(result)
    expected_answer: "{0: 0, 1: 1, 2: 4}"
    hints:
      - Maps each number to its square
    tags: [comprehensions, dict-comp, predict]

  - slug: nested-comp-predict
    objective: Predict nested comprehension output
    title: Nested Comp Predict
    difficulty: 3
    concept: comprehensions
    subconcept: list-comp
    level: edge
    prereqs: [comprehensions.list-comp]
    type: predict
    pattern: mapping
    prompt: What does this code produce?
    code: |
      matrix = [[1, 2], [3, 4]]
      result = [x for row in matrix for x in row]
      print(result)
    expected_answer: "[1, 2, 3, 4]"
    hints:
      - Flattens the nested list
    tags: [comprehensions, nested, predict]
```

**Step 3: Commit**

```bash
git add exercises/python/comprehensions.yaml
git commit -m "content: add 8 fill-in/predict exercises to comprehensions.yaml"
```

---

### Task 3.4: Add fill-in/predict to oop

**Files:**
- Modify: `exercises/python/oop.yaml`

**Step 1: Add 6 fill-in/predict exercises**

Append to `oop.yaml`:

```yaml
  # --- Fill-in Exercises ---
  - slug: class-keyword-fill
    objective: Complete the class definition keyword
    title: Class Keyword Fill-in
    difficulty: 1
    concept: oop
    subconcept: classes
    level: intro
    prereqs: []
    type: fill-in
    pattern: definition
    prompt: Complete the class definition
    template: "___ Person:"
    expected_answer: "class"
    hints:
      - Keyword that starts class definition
    tags: [oop, class, fill-in]

  - slug: init-self-fill
    objective: Complete the __init__ first parameter
    title: Init Self Fill-in
    difficulty: 1
    concept: oop
    subconcept: methods
    level: intro
    prereqs: [oop.classes]
    type: fill-in
    pattern: definition
    prompt: Complete the constructor's first parameter
    template: "def __init__(___, name):"
    expected_answer: "self"
    hints:
      - Always the first parameter in instance methods
    tags: [oop, init, fill-in]

  - slug: super-fill
    objective: Complete the super() call
    title: Super Fill-in
    difficulty: 2
    concept: oop
    subconcept: inheritance
    level: practice
    prereqs: [oop.inheritance]
    type: fill-in
    pattern: invocation
    prompt: Complete to call parent's __init__
    template: "___().__init__(name)"
    expected_answer: "super"
    hints:
      - Built-in to access parent class
    tags: [oop, super, fill-in]

  # --- Predict Exercises ---
  - slug: instance-attribute-predict
    objective: Predict instance attribute access
    title: Instance Attribute Predict
    difficulty: 2
    concept: oop
    subconcept: classes
    level: intro
    prereqs: [oop.classes]
    type: predict
    pattern: invocation
    prompt: What does this code print?
    code: |
      class Person:
          def __init__(self, name):
              self.name = name
      p = Person("Alice")
      print(p.name)
    expected_answer: "Alice"
    hints:
      - self.name stores the passed value
    tags: [oop, attribute, predict]

  - slug: method-call-predict
    objective: Predict method return value
    title: Method Call Predict
    difficulty: 2
    concept: oop
    subconcept: methods
    level: practice
    prereqs: [oop.methods]
    type: predict
    pattern: invocation
    prompt: What does this code print?
    code: |
      class Counter:
          def __init__(self):
              self.count = 0
          def increment(self):
              self.count += 1
              return self.count
      c = Counter()
      print(c.increment())
      print(c.increment())
    expected_answer: |
      1
      2
    hints:
      - Each call increments and returns count
    tags: [oop, method, predict]

  - slug: inheritance-predict
    objective: Predict inherited method behavior
    title: Inheritance Predict
    difficulty: 2
    concept: oop
    subconcept: inheritance
    level: practice
    prereqs: [oop.inheritance]
    type: predict
    pattern: invocation
    prompt: What does this code print?
    code: |
      class Animal:
          def speak(self):
              return "sound"
      class Dog(Animal):
          def speak(self):
              return "bark"
      d = Dog()
      print(d.speak())
    expected_answer: "bark"
    hints:
      - Child method overrides parent
    tags: [oop, inheritance, predict]
```

**Step 2: Commit**

```bash
git add exercises/python/oop.yaml
git commit -m "content: add 6 fill-in/predict exercises to oop.yaml"
```

---

### Task 3.5: Add fill-in/predict to error-handling

**Files:**
- Modify: `exercises/python/error-handling.yaml`

**Step 1: Add 6 fill-in/predict exercises**

Append to `error-handling.yaml`:

```yaml
  # --- Fill-in Exercises ---
  - slug: try-keyword-fill
    objective: Complete the try block keyword
    title: Try Keyword Fill-in
    difficulty: 1
    concept: error-handling
    subconcept: try-except
    level: intro
    prereqs: []
    type: fill-in
    pattern: handling
    prompt: Complete to start a try block
    template: |
      ___:
          risky_operation()
    expected_answer: "try"
    hints:
      - Keyword that starts exception handling
    tags: [exceptions, try, fill-in]

  - slug: except-keyword-fill
    objective: Complete the except clause
    title: Except Keyword Fill-in
    difficulty: 1
    concept: error-handling
    subconcept: try-except
    level: intro
    prereqs: [error-handling.try-except]
    type: fill-in
    pattern: handling
    prompt: Complete to catch ValueError
    template: "___ ValueError:"
    expected_answer: "except"
    hints:
      - Keyword that catches exceptions
    tags: [exceptions, except, fill-in]

  - slug: raise-keyword-fill
    objective: Complete the raise statement
    title: Raise Keyword Fill-in
    difficulty: 2
    concept: error-handling
    subconcept: raising
    level: practice
    prereqs: [error-handling.try-except]
    type: fill-in
    pattern: handling
    prompt: Complete to raise an error
    template: '___ ValueError("Invalid")'
    expected_answer: "raise"
    hints:
      - Keyword to throw an exception
    tags: [exceptions, raise, fill-in]

  # --- Predict Exercises ---
  - slug: try-except-predict
    objective: Predict which block executes
    title: Try-Except Flow Predict
    difficulty: 2
    concept: error-handling
    subconcept: try-except
    level: intro
    prereqs: [error-handling.try-except]
    type: predict
    pattern: handling
    prompt: What does this code print?
    code: |
      try:
          x = int("abc")
          print("success")
      except ValueError:
          print("error")
    expected_answer: "error"
    hints:
      - int("abc") raises ValueError
    tags: [exceptions, try-except, predict]

  - slug: except-type-predict
    objective: Predict exception type matching
    title: Exception Type Predict
    difficulty: 2
    concept: error-handling
    subconcept: try-except
    level: practice
    prereqs: [error-handling.try-except]
    type: predict
    pattern: handling
    prompt: What does this code print?
    code: |
      try:
          x = 1 / 0
      except ValueError:
          print("value error")
      except ZeroDivisionError:
          print("zero division")
    expected_answer: "zero division"
    hints:
      - 1/0 raises ZeroDivisionError, not ValueError
    tags: [exceptions, except, predict]

  - slug: exception-as-predict
    objective: Predict exception message access
    title: Exception As Predict
    difficulty: 2
    concept: error-handling
    subconcept: try-except
    level: practice
    prereqs: [error-handling.try-except]
    type: predict
    pattern: handling
    prompt: What does this code print?
    code: |
      try:
          raise ValueError("oops")
      except ValueError as e:
          print(e)
    expected_answer: "oops"
    hints:
      - 'as e' captures the exception object
    tags: [exceptions, as, predict]
```

**Step 2: Commit**

```bash
git add exercises/python/error-handling.yaml
git commit -m "content: add 6 fill-in/predict exercises to error-handling.yaml"
```

---

### Task 3.6: Add fill-in/predict to modules-files

**Files:**
- Modify: `exercises/python/modules-files.yaml`

**Step 1: Add 6 fill-in/predict exercises**

Append to `modules-files.yaml`:

```yaml
  # --- Fill-in Exercises ---
  - slug: import-keyword-fill
    objective: Complete the import statement
    title: Import Keyword Fill-in
    difficulty: 1
    concept: modules-files
    subconcept: imports
    level: intro
    prereqs: []
    type: fill-in
    pattern: import
    prompt: Complete to import the os module
    template: "___ os"
    expected_answer: "import"
    hints:
      - Keyword to bring in a module
    tags: [imports, fill-in]

  - slug: from-import-fill
    objective: Complete the from-import syntax
    title: From Import Fill-in
    difficulty: 1
    concept: modules-files
    subconcept: imports
    level: intro
    prereqs: [modules-files.imports]
    type: fill-in
    pattern: import
    prompt: Complete to import sqrt from math
    template: "___ math import sqrt"
    expected_answer: "from"
    hints:
      - Keyword for selective imports
    tags: [imports, from, fill-in]

  - slug: with-keyword-fill
    objective: Complete the context manager syntax
    title: With Keyword Fill-in
    difficulty: 2
    concept: modules-files
    subconcept: context
    level: practice
    prereqs: [modules-files.reading]
    type: fill-in
    pattern: context
    prompt: Complete to open file safely
    template: '___ open("file.txt") as f:'
    expected_answer: "with"
    hints:
      - Keyword for context managers
    tags: [files, with, fill-in]

  # --- Predict Exercises ---
  - slug: name-main-predict
    objective: Predict __name__ behavior
    title: Name Main Predict
    difficulty: 2
    concept: modules-files
    subconcept: main-guard
    level: intro
    prereqs: [modules-files.main-guard]
    type: predict
    pattern: conditional
    prompt: What does __name__ equal when script runs directly?
    code: |
      # Running: python script.py
      print(__name__)
    expected_answer: "__main__"
    hints:
      - __name__ is "__main__" when run directly
    tags: [modules, main, predict]

  - slug: file-read-predict
    objective: Predict file read output
    title: File Read Predict
    difficulty: 2
    concept: modules-files
    subconcept: reading
    level: practice
    prereqs: [modules-files.reading]
    type: predict
    pattern: file
    prompt: If file.txt contains "hello", what prints?
    code: |
      with open("file.txt") as f:
          content = f.read()
      print(len(content))
    expected_answer: "5"
    hints:
      - "hello" has 5 characters
    tags: [files, read, predict]

  - slug: path-join-predict
    objective: Predict Path join result
    title: Path Join Predict
    difficulty: 2
    concept: modules-files
    subconcept: pathlib
    level: practice
    prereqs: [modules-files.pathlib]
    type: predict
    pattern: construction
    prompt: What does this produce?
    code: |
      from pathlib import Path
      p = Path("home") / "user" / "file.txt"
      print(p)
    expected_answer: "home/user/file.txt"
    hints:
      - / operator joins path components
    tags: [pathlib, join, predict]
```

**Step 2: Commit**

```bash
git add exercises/python/modules-files.yaml
git commit -m "content: add 6 fill-in/predict exercises to modules-files.yaml"
```

---

### Task 3.7: Add fill-in/predict to collections

**Files:**
- Modify: `exercises/python/collections.yaml`

**Step 1: Add 6 fill-in/predict exercises**

Append to `collections.yaml`:

```yaml
  # --- Fill-in Exercises ---
  - slug: list-bracket-fill
    objective: Complete list literal syntax
    title: List Bracket Fill-in
    difficulty: 1
    concept: collections
    subconcept: lists
    level: intro
    prereqs: []
    type: fill-in
    pattern: construction
    prompt: Complete to create a list
    template: "items = ___1, 2, 3]"
    expected_answer: "["
    hints:
      - Opening bracket for lists
    tags: [lists, syntax, fill-in]

  - slug: dict-brace-fill
    objective: Complete dict literal syntax
    title: Dict Brace Fill-in
    difficulty: 1
    concept: collections
    subconcept: dicts
    level: intro
    prereqs: []
    type: fill-in
    pattern: construction
    prompt: Complete to create a dict
    template: 'data = ___"name": "Alice"}'
    expected_answer: "{"
    hints:
      - Opening brace for dicts
    tags: [dicts, syntax, fill-in]

  - slug: in-operator-fill
    objective: Complete membership test
    title: In Operator Fill-in
    difficulty: 1
    concept: collections
    subconcept: lists
    level: intro
    prereqs: [collections.lists]
    type: fill-in
    pattern: query
    prompt: Complete to check if 5 is in items
    template: "5 ___ items"
    expected_answer: "in"
    hints:
      - Membership test operator
    tags: [collections, in, fill-in]

  # --- Predict Exercises ---
  - slug: list-append-predict
    objective: Predict list after append
    title: List Append Predict
    difficulty: 1
    concept: collections
    subconcept: lists
    level: intro
    prereqs: [collections.lists]
    type: predict
    pattern: mutation
    prompt: What does this code print?
    code: |
      items = [1, 2]
      items.append(3)
      print(items)
    expected_answer: "[1, 2, 3]"
    hints:
      - append adds to the end
    tags: [lists, append, predict]

  - slug: dict-get-predict
    objective: Predict dict.get with default
    title: Dict Get Predict
    difficulty: 2
    concept: collections
    subconcept: dicts
    level: practice
    prereqs: [collections.dicts]
    type: predict
    pattern: lookup
    prompt: What does this code print?
    code: |
      d = {"a": 1}
      print(d.get("b", 0))
    expected_answer: "0"
    hints:
      - get returns default if key missing
    tags: [dicts, get, predict]

  - slug: set-union-predict
    objective: Predict set union result
    title: Set Union Predict
    difficulty: 2
    concept: collections
    subconcept: sets
    level: practice
    prereqs: [collections.sets]
    type: predict
    pattern: construction
    prompt: What does this code print?
    code: |
      a = {1, 2}
      b = {2, 3}
      print(a | b)
    expected_answer: "{1, 2, 3}"
    hints:
      - Union combines unique elements
    tags: [sets, union, predict]
```

**Step 2: Commit**

```bash
git add exercises/python/collections.yaml
git commit -m "content: add 6 fill-in/predict exercises to collections.yaml"
```

---

### Task 3.8: Final validation and Phase 3 completion

**Files:**
- All exercise files

**Step 1: Run the import script**

```bash
cd /home/brett/Documents/Work/srs-app
pnpm db:import-exercises
```

Expected: All exercises validate and import successfully

**Step 2: Get final counts**

```bash
cd /home/brett/Documents/Work/srs-app/exercises/python
echo "=== FINAL EXERCISE COUNTS ==="
total=0
for f in *.yaml; do
  count=$(grep -c "slug:" "$f")
  echo "$f: $count"
  total=$((total + count))
done
echo "=== TOTAL: $total ==="
```

**Step 3: Verify type distribution**

```bash
cd /home/brett/Documents/Work/srs-app/exercises/python
echo "=== EXERCISE TYPE DISTRIBUTION ==="
grep -h "type:" *.yaml | sort | uniq -c | sort -rn
```

Expected: More balanced distribution with fill-in and predict in all concepts

**Step 4: Run tests**

```bash
cd /home/brett/Documents/Work/srs-app
pnpm test
```

Expected: All tests pass

**Step 5: Final commit**

```bash
git add .
git commit -m "content: complete Phase 3 exercise variety

Added fill-in and predict exercises to ALL concepts:
- control-flow.yaml: +12 exercises
- functions.yaml: +12 exercises
- comprehensions.yaml: +8 exercises
- oop.yaml: +6 exercises
- error-handling.yaml: +6 exercises
- modules-files.yaml: +6 exercises
- collections.yaml: +6 exercises

Total new Phase 3 exercises: 56"
```

---

## Summary

### Phase 1: Structural Cleanup (10 tasks)
- 3 file renames (loops→control-flow, classes→oop, exceptions→error-handling)
- 1 prereqs update step
- 4 file deletions (basics, operators, lists, dictionaries)
- 1 exercise cleanup (remove misplaced from foundations)
- 1 validation
- **Result:** 10 files matching curriculum graph exactly

### Phase 2: Gap Filling (6 tasks)
- OOP: +18 exercises (inheritance, classmethod, properties)
- Error Handling: +10 exercises (finally, raising)
- **Result:** Critical gaps filled

### Phase 3: Balance & Polish (8 tasks)
- control-flow: +12 fill-in/predict
- functions: +12 fill-in/predict
- comprehensions: +8 fill-in/predict
- oop: +6 fill-in/predict
- error-handling: +6 fill-in/predict
- modules-files: +6 fill-in/predict
- collections: +6 fill-in/predict
- **Result:** ALL concepts have exercise variety

### Final State
- ~330 total exercises
- 10 files matching curriculum concepts
- Fill-in/predict exercises in EVERY concept
- Better balanced type distribution
