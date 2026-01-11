# Phase 2 Narrative Spine and Lexicon (Draft)

Purpose: define a single base narrative for exercises (TinyStore) and a canonical
lexicon for variables and datasets. This document is the source of truth for
prompt rewrites and generator data in later phases.

## Base Domain: TinyStore
TinyStore is a small online shop with a product catalog, customer accounts,
orders, inventory, and support. It is intentionally simple but realistic enough
to support every concept from strings to OOP and files.

### Narrative Pillars
- Consistent entities: customers, products, orders, inventory, logs.
- Clear workflows: browse -> cart -> checkout -> shipment -> support.
- Practical tasks: calculate totals, filter orders, parse logs, validate inputs.

## Entity Map
| Entity | Description | Core fields |
| --- | --- | --- |
| customer | account holder | customer_id, name, email, tier, is_active |
| product | catalog item | product_id, name, category, price, in_stock |
| order | purchase record | order_id, customer_id, items, total, status |
| line_item | order item | product_id, qty, unit_price |
| inventory | stock record | product_id, on_hand, reorder_level |
| review | feedback | product_id, rating, comment |
| coupon | discount | code, pct, expires_on, is_active |
| event | system event | event_id, kind, ts |
| log_line | audit log | timestamp, level, message |
| ticket | support request | ticket_id, customer_id, status, priority |

## Canonical Datasets
Use three dataset sizes to tune difficulty and repetition.

### Dataset Sizes
- Small: 3-8 records (intro, basics, quick loops)
- Medium: 20-40 records (practice, filtering, grouping)
- Large: 120-500 records (performance, comprehensions, generators)

Implementation:
- Canonical datasets and lexicon live in `src/lib/generators/tinystore-data.ts`.
- Default sizes are 6 (small), 24 (medium), and 120 (large) for generator use.

### Dataset Names
- customers_small, customers_medium, customers_large
- products_small, products_medium, products_large
- orders_small, orders_medium, orders_large
- inventory_small, inventory_medium, inventory_large
- reviews_small, reviews_medium, reviews_large
- events_small, events_medium, events_large
- log_lines_small, log_lines_medium, log_lines_large

### Record Shapes (Python examples)
```py
customer = {
    "customer_id": 101,
    "name": "Ava",
    "email": "ava@tinystore.test",
    "tier": "silver",
    "is_active": True,
}

product = {
    "product_id": 11,
    "name": "mug",
    "category": "kitchen",
    "price": 12.5,
    "in_stock": 9,
}

order = {
    "order_id": 501,
    "customer_id": 101,
    "items": [{"product_id": 11, "qty": 2, "unit_price": 12.5}],
    "total": 25.0,
    "status": "paid",
}

inventory = {
    "product_id": 11,
    "on_hand": 9,
    "reorder_level": 3,
}

review = {
    "product_id": 11,
    "rating": 4,
    "comment": "nice mug",
}

event = {
    "event_id": "evt_001",
    "kind": "checkout",
    "ts": "2026-01-11T10:30:00Z",
}

log_line = "2026-01-11T10:30:00Z INFO checkout order_id=501"
```

## Variable Lexicon
Use these names consistently in prompts and scaffolding.

### Core Vars
- customer_id, product_id, order_id, ticket_id
- customer, product, order, line_item, inventory
- customers, products, orders, inventory_records, reviews
- order_total, subtotal, tax_rate, discount_pct, quantity
- status: pending, paid, shipped, delivered, canceled
- tier: bronze, silver, gold
- priority: low, medium, high

### File and Path Vars
- filenames: orders.csv, inventory.json, events.log, customers.txt
- dir names: data_dir, logs_dir, exports_dir
- file handles: file, infile, outfile

### Function and Class Names
- functions: compute_total, apply_discount, filter_orders, parse_log
- classes: Order, Product, Customer, InventoryItem

## Prompt Language Guide
- Use "TinyStore" as the default setting.
- Prefer "customer" over "user"; prefer "product" over "item."
- Avoid synonym drift (do not swap "order" with "purchase" mid prompt).
- Use active, specific verbs: add, update, remove, compute, filter, parse.
- State inputs and outputs explicitly; avoid implied side effects.
- For predict exercises, include the full program and final print output.
- For write/fill-in exercises, include exact variable names in instructions.

## Skin Substitution Mapping
Each skin supplies substitutions for the base TinyStore lexicon. The table below
shows the current values pulled from `paths/python/skins/*.yaml`.

| Skin | entity_name | item_singular | user_role | list_name | filename | action_verb |
| --- | --- | --- | --- | --- | --- | --- |
| api-client | Endpoint | endpoint | client | endpoints | api_response.json | request |
| api-guardian | Request | request | guardian | requests | error_log.json | guard |
| batch-processor | Record | record | processor | records | batch_output.json | process |
| calculator-app | Calculation | calculation | user | history | history.json | calculate |
| config-manager | Config | config | admin | configs | config.json | configure |
| csv-parser | Row | record | data analyst | records | data.csv | parse |
| devops-toolkit | Server | server | sysadmin | servers | inventory.yaml | deploy |
| dungeon-crawler | Hero | item | adventurer | inventory | save.json | explore |
| fantasy-game | Item | item | player | inventory | inventory.json | equip |
| game-inventory | Item | item | player | inventory | inventory.json | equip |
| hello-python | Variable | value | learner | values | data.txt | practice |
| log-analyzer | LogEntry | log | analyst | logs | analysis.json | analyze |
| markdown-editor | Document | document | editor | documents | output.md | format |
| music-app | Track | track | listener | playlist | playlist.json | play |
| pet-simulator | Pet | pet | owner | pets | pets.json | feed |
| playlist-app | Track | song | listener | playlist | playlist.json | play |
| recipe-book | Recipe | recipe | chef | recipes | recipes.json | cook |
| sdk-builder | Client | endpoint | SDK developer | endpoints | config.json | request |
| shopping-cart | Product | item | customer | cart | cart.json | buy |
| signup-form | Field | field | validator | fields | form_data.json | validate |
| task-manager | Task | task | user | tasks | tasks.json | complete |
| user-database | User | user | admin | users | users.json | query |

## Phase 2 Exit Checklist
- Narrative Bible approved and linked in plan doc.
- Canonical dataset names and shapes defined for generators.
- Prompt language guide agreed upon for future rewrites.

## Skin Authoring Guide

### Purpose

Skins translate TinyStore's canonical entities into domain-specific names while maintaining the same structural relationships. This allows exercises to feel contextually relevant while the underlying learning progression stays consistent.

### Required Structural Variables

Every skin MUST define these variables that map to TinyStore concepts:

| Variable | TinyStore Concept | Example (task-manager) |
|----------|-------------------|------------------------|
| `list_name` | products/orders/customers | tasks |
| `item_singular` | product/order/customer | task |
| `item_plural` | products/orders/customers | tasks |
| `item_examples` | ["mug", "notebook", "lamp"] | ["buy groceries", "call mom"] |
| `record_keys` | ["product_id", "name", "price"] | ["title", "done", "priority"] |
| `attr_key_1` | price, total, rating | priority |
| `attr_key_2` | quantity, status, tier | due_date |
| `id_var` | product_id, order_id | task_id |

### Structural Consistency

The skin's domain should support these patterns:

1. **Collection of records**: `list_name` contains multiple `item_singular` items
2. **Record with ID**: Each item has an `id_var` for unique identification
3. **Numeric/Status attributes**: `attr_key_1` and `attr_key_2` for comparison/filtering
4. **File persistence**: `filename` for saving/loading the collection

### Context Text Guidelines

Each context should:
- Be 20-80 characters
- Reference the skin's domain terms
- Explain WHY this step matters in the workflow
- Avoid generic phrases like "Use this step" or "TODO"

Good: "Save tasks to a file so they persist between sessions."
Bad: "Use this step in the Task Manager workflow: File Write."

### Validation

Run `pnpm validate:paths` to check:
- All required structural variables are present
- No placeholder contexts remain
- Context text meets minimum length