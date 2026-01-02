# Skeleton Dashboard Design

> Replaces the home page with a unified dashboard showing system health + auth status

## Overview

Transform `src/app/page.tsx` from a standalone auth page into a dashboard that verifies the application foundation is working correctly.

## Page Structure

Two-section layout:

**Top Section: System Health**
- Row of 3 status cards: Environment, Auth Connection, Database
- Each card shows: check name, status indicator, brief message
- Uses existing Tailwind styling patterns

**Bottom Section: Auth Status**
- Existing auth UI unchanged
- Login form when signed out, user info when signed in

```
┌─────────────────────────────────────────┐
│           System Health                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Env ✓   │ │ Auth ✓  │ │ DB —    │   │
│  └─────────┘ └─────────┘ └─────────┘   │
├─────────────────────────────────────────┤
│           Auth Status                   │
│      [Email input]                      │
│      [Send Magic Link]                  │
└─────────────────────────────────────────┘
```

## Status Checks

| Check | Logic | Success | Failure |
|-------|-------|---------|---------|
| Environment | Check `NEXT_PUBLIC_SUPABASE_*` vars exist | "Configured" | "Missing credentials" |
| Auth Connection | Call `supabase.auth.getSession()` | "Connected" | Error message |
| Database | Placeholder for now | "Not configured" (neutral) | — |

## Status Indicator States

| State | Visual | Color |
|-------|--------|-------|
| Pending | "..." | Yellow/amber |
| Success | ✓ | Green |
| Error | ✗ | Red |
| Not configured | — | Gray/muted |

## State Management

```typescript
type CheckStatus = 'pending' | 'success' | 'error' | 'not-configured';

interface SystemChecks {
  env: { status: CheckStatus; message: string };
  auth: { status: CheckStatus; message: string };
  database: { status: CheckStatus; message: string };
}
```

- System checks in separate state from auth state
- Env check runs synchronously on mount
- Auth check runs async
- Database set to `not-configured` immediately

## Future Extensibility

**When database tables are added:**
- Update database check to query `supabase.from('profiles').select('count').limit(1)`
- Change from `not-configured` to actual health check

**Adding more checks:**
- Add key to `SystemChecks` type
- Add card to grid (flex-wrap handles overflow)

## Implementation

Single file change: `src/app/page.tsx`

No new dependencies required.
