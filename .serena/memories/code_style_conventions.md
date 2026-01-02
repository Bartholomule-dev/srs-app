# Code Style and Conventions

## TypeScript
- **Strict mode enabled** - No `any` types allowed
- **Path alias:** `@/*` maps to `src/*`
- Import module specifier: relative paths preferred
- Generated types live in `src/lib/types/database.generated.ts`
- Application types with camelCase in `src/lib/types/app.types.ts`

## React / Next.js
- **App Router** (not Pages Router)
- Use `"use client"` directive for interactive components
- Server Components for static/metadata content
- React Compiler enabled for auto-optimization

## Styling
- **Tailwind CSS 4** with utility-first approach
- Dark mode via `prefers-color-scheme` and CSS variables
- No CSS modules or styled-components

## Naming Conventions
- **Files:** kebab-case (e.g., `user-progress.ts`)
- **Components:** PascalCase (e.g., `ExerciseCard.tsx`)
- **Functions/Variables:** camelCase
- **Database columns:** snake_case (mapped to camelCase in app code)

## Commit Messages (Conventional Commits)
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Refactoring code |
| `test` | Adding tests |
| `chore` | Maintenance |

## Database Patterns
- Use camelCase mappers from `src/lib/supabase/mappers.ts`
- Use `DbResult<T>` helper for type-safe database operations
- RLS enabled on all user tables
- Always use `auth.uid()` for user scoping

## Testing Patterns
- Unit tests: `tests/unit/*.test.ts`
- Integration tests: `tests/integration/**/*.test.ts`
- E2E tests: `tests/*.spec.ts` (Playwright)
- Test setup with safety checks against production in `tests/setup.ts`
