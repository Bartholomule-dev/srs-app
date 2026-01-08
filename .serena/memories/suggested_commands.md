# Suggested Commands for SRS-App Development

## Development Server
```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Create production build
pnpm start        # Run production build
```

## Code Quality
```bash
pnpm lint         # Run ESLint checks
pnpm typecheck    # Run TypeScript type checking
```

## Testing
```bash
pnpm test              # Run Vitest in watch mode
pnpm test:run          # Run Vitest once
pnpm test:coverage     # Run with coverage report

# Playwright E2E tests
pnpm exec playwright test                    # Run all E2E tests
pnpm exec playwright test --ui               # Run with UI
pnpm exec playwright test tests/e2e/critical-path.spec.ts  # Run specific file
pnpm exec playwright codegen localhost:3000  # Generate tests
```

## Exercise Validation
```bash
pnpm validate:exercises   # Schema validation (Ajv against schema.json)
pnpm validate:curriculum  # Curriculum consistency validation
pnpm validate:dynamic     # Dynamic exercise rendering validation
pnpm validate:all         # Run all validations
```

## Database (Supabase Local)
```bash
pnpm db:start     # Start local Supabase (Docker required)
pnpm db:stop      # Stop local Supabase
pnpm db:reset     # Reset database (runs migrations + seeds)
pnpm db:types     # Regenerate TypeScript types from schema
```

## Supabase CLI (Direct)
```bash
npx supabase migration new <name>   # Create new migration
npx supabase db push                # Apply migrations
npx supabase gen types typescript --local > src/lib/types/database.generated.ts
```

## Package Management
```bash
pnpm install              # Install dependencies
pnpm add <package>        # Add production dependency
pnpm add -D <package>     # Add dev dependency
```

## Git Workflow
```bash
git checkout -b feature/<name>     # Create feature branch
git commit -m "feat: description"  # Conventional commit
```

## System Utilities (Linux)
```bash
ls, cd, grep, find, cat   # Standard unix commands
lsof -i :3000             # Find process on port
kill -9 <PID>             # Kill process
```
