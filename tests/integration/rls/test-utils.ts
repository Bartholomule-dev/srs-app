/**
 * RLS Test Utilities
 *
 * Re-exports shared Supabase utilities for RLS tests.
 * This file exists for backwards compatibility - new tests should
 * import directly from @tests/fixtures/supabase.
 */
export {
  serviceClient,
  anonClient,
  createTestUser,
  deleteTestUser,
} from '@tests/fixtures/supabase';
