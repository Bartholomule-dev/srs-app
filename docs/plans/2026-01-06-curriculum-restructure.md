# Curriculum Restructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure exercise files to match curriculum graph concepts exactly, eliminate redundancy, and establish foundation for content expansion.

**Architecture:** 10 YAML files matching 10 curriculum concepts. Each file is the single source of truth for its concept. Import script already loads all YAML files dynamically - no code changes needed for file renames.

**Tech Stack:** YAML exercise files, TypeScript import script, Supabase database

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

### Task 1.4: Merge basics.yaml into foundations.yaml

**Files:**
- Read: `exercises/python/basics.yaml` (5 exercises to merge)
- Modify: `exercises/python/foundations.yaml` (append exercises)
- Delete: `exercises/python/basics.yaml`

**Step 1: Verify no duplicate slugs**

```bash
cd /home/brett/Documents/Work/srs-app/exercises/python
for slug in print-hello-world variable-assignment string-variable type-check user-input; do
  grep -q "slug: $slug" foundations.yaml && echo "DUPLICATE: $slug" || echo "OK: $slug"
done
```

Expected: All 5 should show "OK"

**Step 2: Append basics.yaml exercises to foundations.yaml**

Add these 5 exercises to the end of `foundations.yaml` (before the final newline), under a new comment section:

```yaml
  # --- Merged from basics.yaml ---
  - slug: print-hello-world
    objective: Write a print statement to output text to the console
    title: Print Hello World
    difficulty: 1
    prompt: Print the text "Hello, World!" to the console
    expected_answer: print("Hello, World!")
    accepted_solutions:
      - "print('Hello, World!')"
    hints:
      - Use the print() function
      - Put the text in quotes
    tags: [print, strings, beginner]
    concept: foundations
    subconcept: io
    level: intro
    prereqs: []
    type: write
    pattern: io

  - slug: variable-assignment
    objective: Assign a numeric value to a variable using the assignment operator
    title: Variable Assignment
    difficulty: 1
    prompt: Assign the value 42 to a variable named answer
    expected_answer: answer = 42
    hints:
      - Use the = operator
      - Variable name goes on the left
    tags: [variables, assignment, beginner]
    concept: foundations
    subconcept: variables
    level: intro
    prereqs: []
    type: write
    pattern: assignment

  - slug: string-variable
    objective: Create a variable and assign a string value to it
    title: String Variable
    difficulty: 1
    prompt: Create a variable called name with the value "Alice"
    expected_answer: name = "Alice"
    accepted_solutions:
      - "name = 'Alice'"
    hints:
      - Use quotes for strings
    tags: [variables, strings, beginner]
    concept: foundations
    subconcept: variables
    level: intro
    prereqs: []
    type: write
    pattern: assignment

  - slug: type-check
    objective: Use the type() function to inspect the data type of a variable
    title: Type Check
    difficulty: 1
    prompt: Get the type of the variable x
    expected_answer: type(x)
    hints:
      - Use the type() function
    tags: [types, functions, beginner]
    concept: foundations
    subconcept: expressions
    level: intro
    prereqs: []
    type: write
    pattern: invocation

  - slug: user-input
    objective: Capture user input with a custom prompt message using input()
    title: User Input
    difficulty: 2
    prompt: Get input from user with the prompt "Enter name:"
    expected_answer: input("Enter name:")
    accepted_solutions:
      - "input('Enter name:')"
    hints:
      - Use the input() function
      - Pass the prompt as a string argument
    tags: [input, functions, beginner]
    concept: foundations
    subconcept: io
    level: practice
    prereqs: []
    type: write
    pattern: io
```

**Step 3: Delete basics.yaml**

```bash
rm basics.yaml
```

**Step 4: Verify exercise count**

```bash
grep -c "slug:" foundations.yaml
```

Expected: 51 (was 46, added 5)

**Step 5: Commit**

```bash
git add exercises/python/
git commit -m "refactor: merge basics.yaml into foundations.yaml"
```

---

### Task 1.5: Merge operators.yaml into foundations.yaml

**Files:**
- Read: `exercises/python/operators.yaml` (5 exercises to merge)
- Modify: `exercises/python/foundations.yaml` (append exercises)
- Delete: `exercises/python/operators.yaml`

**Step 1: Verify no duplicate slugs**

```bash
cd /home/brett/Documents/Work/srs-app/exercises/python
for slug in floor-division modulo-operator exponentiation comparison-chain logical-and; do
  grep -q "slug: $slug" foundations.yaml && echo "DUPLICATE: $slug" || echo "OK: $slug"
done
```

Expected: Some may show DUPLICATE (these are actual duplicates to skip)

**Step 2: Check which are duplicates**

From investigation:
- `floor-division` → foundations has `floor-division-intro` (similar, keep operators version as it's cleaner)
- `modulo-operator` → foundations has `modulo-operator-intro` (similar, keep operators version)
- `exponentiation` → foundations has `exponentiation-intro` (similar, keep operators version)
- `comparison-chain` → foundations has different versions (different bounds, keep both)
- `logical-and` → foundations has `boolean-and` (similar, keep operators version as cleaner)

**Decision:** The operators.yaml versions are cleaner. We'll keep them and note they supplement the existing ones. Since slugs are different, no conflict.

**Step 3: Append operators.yaml exercises to foundations.yaml**

Add to end of `foundations.yaml`:

```yaml
  # --- Merged from operators.yaml ---
  - slug: floor-division
    objective: Perform integer division that rounds down using the // operator
    title: Floor Division
    difficulty: 1
    prompt: Divide 17 by 5 using floor division
    expected_answer: 17 // 5
    hints:
      - Use // for floor division
    tags: [operators, division, beginner]
    concept: foundations
    subconcept: operators
    level: intro
    prereqs: []
    type: write
    pattern: arithmetic

  - slug: modulo-operator
    objective: Calculate the remainder of a division using the modulo operator
    title: Modulo Operator
    difficulty: 1
    prompt: Get the remainder of 17 divided by 5
    expected_answer: 17 % 5
    hints:
      - Use % for modulo
    tags: [operators, modulo, beginner]
    concept: foundations
    subconcept: operators
    level: intro
    prereqs: []
    type: write
    pattern: arithmetic

  - slug: exponentiation
    objective: Raise a number to a power using the exponentiation operator
    title: Exponentiation
    difficulty: 1
    prompt: Calculate 2 to the power of 10
    expected_answer: 2 ** 10
    hints:
      - Use ** for exponentiation
    tags: [operators, power, beginner]
    concept: foundations
    subconcept: operators
    level: intro
    prereqs: []
    type: write
    pattern: arithmetic

  - slug: comparison-chain
    objective: Use chained comparisons to check if a value falls within a range
    title: Comparison Chain
    difficulty: 2
    prompt: Check if x is between 1 and 10 (inclusive) using chained comparison
    expected_answer: 1 <= x <= 10
    hints:
      - Python supports chained comparisons
      - Use <= for inclusive bounds
    tags: [operators, comparison, intermediate]
    concept: foundations
    subconcept: operators
    level: practice
    prereqs: []
    type: write
    pattern: comparison

  - slug: logical-and
    objective: Combine boolean expressions using the logical and operator
    title: Logical And
    difficulty: 1
    prompt: Check if both a and b are True
    expected_answer: a and b
    hints:
      - Use the 'and' keyword
    tags: [operators, logical, beginner]
    concept: foundations
    subconcept: operators
    level: intro
    prereqs: []
    type: write
    pattern: logical
```

**Step 4: Delete operators.yaml**

```bash
rm operators.yaml
```

**Step 5: Verify exercise count**

```bash
grep -c "slug:" foundations.yaml
```

Expected: 56 (was 51, added 5)

**Step 6: Commit**

```bash
git add exercises/python/
git commit -m "refactor: merge operators.yaml into foundations.yaml"
```

---

### Task 1.6: Merge lists.yaml into collections.yaml

**Files:**
- Read: `exercises/python/lists.yaml` (5 exercises)
- Modify: `exercises/python/collections.yaml` (append unique exercises)
- Delete: `exercises/python/lists.yaml`

**Step 1: Check for duplicate slugs**

```bash
cd /home/brett/Documents/Work/srs-app/exercises/python
for slug in list-creation list-append list-indexing list-slicing list-extend; do
  grep -q "slug: $slug" collections.yaml && echo "DUPLICATE: $slug" || echo "OK: $slug"
done
```

From investigation, collections.yaml has:
- `list-create-empty` (different)
- `list-create-values` (similar to list-creation but different slug)
- `list-extend-method` (similar to list-extend)

**Decision:** Keep unique ones from lists.yaml:
- `list-creation` - keep (different from list-create-values, includes variable name)
- `list-append` - keep (not in collections)
- `list-indexing` - keep (not in collections)
- `list-slicing` - keep (not in collections)
- `list-extend` - SKIP (duplicate of list-extend-method)

**Step 2: Append 4 unique exercises to collections.yaml**

Add to end of `collections.yaml`:

```yaml
  # --- Merged from lists.yaml ---
  - slug: list-creation
    objective: Create a list with multiple elements using square bracket syntax
    title: List Creation
    difficulty: 1
    concept: collections
    subconcept: lists
    level: intro
    prereqs: []
    type: write
    pattern: construction
    prompt: Create a list called numbers containing 1, 2, 3
    expected_answer: numbers = [1, 2, 3]
    hints:
      - Use square brackets
    tags: [lists, creation, beginner]

  - slug: list-append
    objective: Add a single element to the end of a list using append()
    title: List Append
    difficulty: 1
    concept: collections
    subconcept: lists
    level: intro
    prereqs: []
    type: write
    pattern: mutation
    prompt: Add the value 4 to the end of the list numbers
    expected_answer: numbers.append(4)
    hints:
      - Use the append() method
    tags: [lists, methods, beginner]

  - slug: list-indexing
    objective: Access a specific list element by its zero-based index position
    title: List Indexing
    difficulty: 1
    concept: collections
    subconcept: lists
    level: intro
    prereqs: []
    type: write
    pattern: indexing
    prompt: Get the second element of list items
    expected_answer: items[1]
    hints:
      - Use square bracket indexing
      - Remember indices start at 0
    tags: [lists, indexing, beginner]

  - slug: list-slicing
    objective: Extract a subset of list elements using slice notation
    title: List Slicing
    difficulty: 2
    concept: collections
    subconcept: lists
    level: practice
    prereqs: [lists]
    type: write
    pattern: indexing
    prompt: Get the first 3 elements of list items
    expected_answer: items[:3]
    hints:
      - Use slice notation
      - Omit start to begin at 0
    tags: [lists, slicing, intermediate]
```

**Step 3: Delete lists.yaml**

```bash
rm lists.yaml
```

**Step 4: Verify exercise count**

```bash
grep -c "slug:" collections.yaml
```

Expected: 47 (was 43, added 4)

**Step 5: Commit**

```bash
git add exercises/python/
git commit -m "refactor: merge lists.yaml into collections.yaml"
```

---

### Task 1.7: Merge dictionaries.yaml into collections.yaml

**Files:**
- Read: `exercises/python/dictionaries.yaml` (5 exercises)
- Modify: `exercises/python/collections.yaml` (append unique exercises)
- Delete: `exercises/python/dictionaries.yaml`

**Step 1: Check for duplicate slugs**

```bash
cd /home/brett/Documents/Work/srs-app/exercises/python
for slug in dict-creation dict-access dict-get dict-keys dict-update; do
  grep -q "slug: $slug" collections.yaml && echo "DUPLICATE: $slug" || echo "OK: $slug"
done
```

From investigation, collections.yaml has:
- `dict-create-empty` (different)
- `dict-create-values` (similar)
- `dict-bracket-access` (similar to dict-access)
- `dict-get-default` (similar to dict-get)
- `dict-keys-method` (similar to dict-keys)

**Decision:** These are all duplicates with slightly different prompts. Since collections.yaml already has comprehensive dict coverage, SKIP all 5 from dictionaries.yaml.

**Step 2: Delete dictionaries.yaml (no merge needed)**

```bash
rm dictionaries.yaml
```

**Step 3: Commit**

```bash
git add exercises/python/
git commit -m "refactor: remove redundant dictionaries.yaml (content already in collections.yaml)"
```

---

### Task 1.8: Move numbers-booleans exercises from foundations.yaml

**Files:**
- Modify: `exercises/python/foundations.yaml` (remove 10 exercises)
- Modify: `exercises/python/numbers-booleans.yaml` (add 10 exercises if not already there)

**Step 1: Identify exercises to move**

From investigation, foundations.yaml has 10 exercises with `concept: numbers-booleans`:
- 5 with `subconcept: truthiness`
- 5 with `subconcept: comparisons`

**Step 2: Check if these exercises already exist in numbers-booleans.yaml**

```bash
grep "subconcept: truthiness\|subconcept: comparisons" numbers-booleans.yaml | wc -l
```

If count is 8 (4 truthiness + 4 comparisons), then numbers-booleans.yaml already has coverage.

**Decision:** The 10 exercises in foundations.yaml with `concept: numbers-booleans` should be REMOVED (they're misplaced). Numbers-booleans.yaml already has its own coverage.

**Step 3: Remove the 10 misplaced exercises from foundations.yaml**

Remove all exercises where `concept: numbers-booleans` from foundations.yaml. These are the slugs to remove:
- `truthiness-empty-list`
- `truthiness-zero`
- `truthiness-empty-string`
- `truthiness-none`
- `truthiness-check`
- `comparison-is-none`
- `comparison-is-not`
- `comparison-equality-vs-identity`
- `comparison-in-operator`
- `comparison-chained`

**Step 4: Verify exercise count after removal**

```bash
grep -c "slug:" foundations.yaml
```

Expected: 46 (56 - 10 removed)

**Step 5: Commit**

```bash
git add exercises/python/
git commit -m "refactor: remove misplaced numbers-booleans exercises from foundations.yaml"
```

---

### Task 1.9: Validate final structure and run import

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

**Step 4: Commit final cleanup**

```bash
git add .
git commit -m "refactor: complete Phase 1 curriculum restructure

- Renamed: loops.yaml → control-flow.yaml
- Renamed: classes.yaml → oop.yaml
- Renamed: exceptions.yaml → error-handling.yaml
- Merged: basics.yaml → foundations.yaml (5 exercises)
- Merged: operators.yaml → foundations.yaml (5 exercises)
- Merged: lists.yaml → collections.yaml (4 exercises)
- Deleted: dictionaries.yaml (redundant)
- Removed: 10 misplaced numbers-booleans exercises from foundations.yaml

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

## Phase 3: Balance & Polish

### Task 3.1: Add fill-in exercises to control-flow

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

**Step 2: Commit**

```bash
git add exercises/python/control-flow.yaml
git commit -m "content: add 6 fill-in exercises to control-flow.yaml"
```

---

### Task 3.2: Add predict exercises to control-flow

**Files:**
- Modify: `exercises/python/control-flow.yaml`

**Step 1: Add 6 predict exercises**

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

**Step 2: Commit**

```bash
git add exercises/python/control-flow.yaml
git commit -m "content: add 6 predict exercises to control-flow.yaml"
```

---

### Task 3.3: Add fill-in exercises to functions

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

**Step 2: Commit**

```bash
git add exercises/python/functions.yaml
git commit -m "content: add 6 fill-in exercises to functions.yaml"
```

---

### Task 3.4: Add predict exercises to functions

**Files:**
- Modify: `exercises/python/functions.yaml`

**Step 1: Add 6 predict exercises**

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

**Step 2: Commit**

```bash
git add exercises/python/functions.yaml
git commit -m "content: add 6 predict exercises to functions.yaml"
```

---

### Task 3.5: Add fill-in and predict to comprehensions

**Files:**
- Modify: `exercises/python/comprehensions.yaml`

**Step 1: Add 4 fill-in exercises**

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

  - slug: generator-paren-fill
    objective: Identify generator expression syntax
    title: Generator Syntax Fill-in
    difficulty: 2
    concept: comprehensions
    subconcept: generator-exp
    level: practice
    prereqs: [comprehensions.list-comp]
    type: fill-in
    pattern: mapping
    prompt: Complete to create a generator (not a list)
    template: "gen = ___(x * 2 for x in range(5))"
    expected_answer: ""
    hints:
      - Generators use parentheses directly
      - No function call needed if standalone
    tags: [comprehensions, generator-exp, fill-in]
```

**Step 2: Add 4 predict exercises**

Append to `comprehensions.yaml`:

```yaml
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

### Task 3.6: Final validation and Phase 3 completion

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

Added fill-in and predict exercises to:
- control-flow.yaml: +12 exercises
- functions.yaml: +12 exercises
- comprehensions.yaml: +8 exercises

Total new exercises: 32
Total exercises now: ~320"
```

---

## Summary

### Phase 1: Structural Cleanup
- 3 file renames (loops→control-flow, classes→oop, exceptions→error-handling)
- 4 file merges/deletions (basics, operators, lists, dictionaries)
- Result: 10 files matching curriculum graph

### Phase 2: Gap Filling
- OOP: +18 exercises (inheritance, classmethod, properties)
- Error Handling: +10 exercises (finally, raising)
- Result: Critical gaps filled

### Phase 3: Balance & Polish
- Control Flow: +12 fill-in/predict exercises
- Functions: +12 fill-in/predict exercises
- Comprehensions: +8 fill-in/predict exercises
- Result: Better exercise variety

### Final State
- ~320 total exercises (up from 278)
- 10 files matching curriculum concepts
- Better fill-in/predict coverage across all concepts
