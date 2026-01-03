-- Development seed data
-- This file is NOT a migration. It only runs locally via:
--   npx supabase db reset
--
-- It will NOT run in production.

INSERT INTO exercises (language, category, difficulty, title, slug, prompt, expected_answer, hints, explanation, tags) VALUES

-- Basics
('python', 'basics', 1, 'Print Statement',
 'basics-print-statement',
 'Print the text "Hello, World!" to the console',
 'print("Hello, World!")',
 '["Use the print() function", "Put the text in quotes"]',
 'The print() function outputs text to the console.',
 ARRAY['print', 'strings', 'beginner']),

('python', 'basics', 1, 'Variable Assignment',
 'basics-variable-assignment',
 'Assign the value 42 to a variable named answer',
 'answer = 42',
 '["Use the = operator", "Variable name goes on the left"]',
 'Variables are assigned using the = operator.',
 ARRAY['variables', 'assignment', 'beginner']),

('python', 'basics', 1, 'String Variable',
 'basics-string-variable',
 'Create a variable called name with the value "Alice"',
 'name = "Alice"',
 '["Use quotes for strings"]',
 'String values must be wrapped in quotes.',
 ARRAY['variables', 'strings', 'beginner']),

-- Loops
('python', 'loops', 1, 'For Loop Range',
 'loops-for-loop-range',
 'Write a for loop that prints numbers 0 through 4',
 'for i in range(5):\n    print(i)',
 '["Use range() to generate numbers", "range(5) gives 0-4"]',
 'range(n) generates numbers from 0 to n-1.',
 ARRAY['loops', 'range', 'for']),

('python', 'loops', 2, 'For Loop List',
 'loops-for-loop-list',
 'Iterate over a list called items and print each item',
 'for item in items:\n    print(item)',
 '["Use: for x in list:"]',
 'Python for loop iterates directly over elements.',
 ARRAY['loops', 'lists', 'for']),

('python', 'loops', 2, 'While Loop',
 'loops-while-loop',
 'Write a while loop that runs while count < 5',
 'while count < 5:',
 '["Use while keyword"]',
 'While loops continue as long as the condition is True.',
 ARRAY['loops', 'while', 'conditions']),

('python', 'loops', 3, 'Enumerate',
 'loops-enumerate',
 'Loop over items with both index and value using enumerate',
 'for i, item in enumerate(items):',
 '["enumerate() gives index and value"]',
 'enumerate() returns pairs of (index, value).',
 ARRAY['loops', 'enumerate', 'intermediate']),

-- Functions
('python', 'functions', 1, 'Define Function',
 'functions-define-function',
 'Define a function called greet that takes a name parameter',
 'def greet(name):',
 '["Start with def keyword"]',
 'Functions are defined with def.',
 ARRAY['functions', 'def', 'beginner']),

('python', 'functions', 2, 'Function with Return',
 'functions-function-with-return',
 'Define a function add that takes a and b, returns their sum',
 'def add(a, b):\n    return a + b',
 '["Use return to send back a value"]',
 'Return statements send a value back to the caller.',
 ARRAY['functions', 'return', 'parameters']),

('python', 'functions', 2, 'Default Parameter',
 'functions-default-parameter',
 'Define greet(name, greeting="Hello") with a default greeting',
 'def greet(name, greeting="Hello"):',
 '["Default values use ="]',
 'Default parameters let callers omit arguments.',
 ARRAY['functions', 'defaults', 'intermediate']),

-- Lists
('python', 'lists', 1, 'Create List',
 'lists-create-list',
 'Create a list called numbers containing 1, 2, 3',
 'numbers = [1, 2, 3]',
 '["Use square brackets"]',
 'Lists are created with square brackets.',
 ARRAY['lists', 'creation', 'beginner']),

('python', 'lists', 1, 'Append to List',
 'lists-append-to-list',
 'Add the value 4 to the end of the list numbers',
 'numbers.append(4)',
 '["Use the append() method"]',
 'append() adds an item to the end of a list.',
 ARRAY['lists', 'append', 'methods']),

-- Dictionaries
('python', 'dictionaries', 1, 'Create Dictionary',
 'dictionaries-create-dictionary',
 'Create a dict called person with name="Alice" and age=30',
 'person = {"name": "Alice", "age": 30}',
 '["Use curly braces", "key: value pairs"]',
 'Dictionaries store key-value pairs.',
 ARRAY['dictionaries', 'creation', 'beginner']),

('python', 'dictionaries', 1, 'Access Dictionary',
 'dictionaries-access-dictionary',
 'Get the value of "name" from the person dictionary',
 'person["name"]',
 '["Use square brackets with the key"]',
 'Access dictionary values using bracket notation.',
 ARRAY['dictionaries', 'access', 'beginner']),

-- Comprehensions
('python', 'comprehensions', 2, 'List Comprehension Basic',
 'comprehensions-list-comprehension-basic',
 'Create a list of squares from 1 to 5 using comprehension',
 '[x**2 for x in range(1, 6)]',
 '["[expression for item in iterable]"]',
 'List comprehensions are concise ways to create lists.',
 ARRAY['comprehensions', 'lists', 'intermediate']),

-- Classes
('python', 'classes', 2, 'Define Class',
 'classes-define-class',
 'Define a class called Person',
 'class Person:',
 '["Use class keyword"]',
 'Classes are defined with the class keyword.',
 ARRAY['classes', 'oop', 'intermediate']);
