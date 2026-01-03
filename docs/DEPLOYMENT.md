# Deployment Guide

## One-Time Setup (Manual)

### 1. Create Supabase Production Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose organization and name (e.g., `srs-app-prod`)
4. Set a strong database password (save it!)
5. Choose region closest to your users (e.g., `us-east-1`)
6. Wait for project to provision (~2 minutes)

### 2. Apply Migrations

```bash
# Link to production project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push

# Import exercises
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY \
pnpm run import-exercises
```

### 3. Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - from Supabase dashboard → Settings → API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - from Supabase dashboard → Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY` - from Supabase dashboard → Settings → API (keep secret!)
5. Click "Deploy"

### 4. Add GitHub Secrets

In your GitHub repo → Settings → Secrets and variables → Actions:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 5. Verify RLS (Post-Deploy)

1. Sign up with email A, complete a practice session
2. Sign up with email B in incognito, complete a practice session
3. Verify each user only sees their own stats/progress

## Ongoing Deployment

After initial setup, deployment is automatic:

1. Push to any branch → Vercel creates preview deployment
2. Open PR → CI runs unit tests, E2E runs against preview
3. Merge to main → Vercel deploys to production

## Rollback

If something breaks in production:

1. Go to Vercel dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"
