/**
 * Global test setup
 *
 * SAFETY: These tests are designed for LOCAL Supabase only.
 * The default keys are local Supabase demo keys that won't work on real projects.
 */

// Warn if tests might be running against a real Supabase project
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
if (supabaseUrl && !supabaseUrl.includes('127.0.0.1') && !supabaseUrl.includes('localhost')) {
  console.warn(
    '\n⚠️  WARNING: NEXT_PUBLIC_SUPABASE_URL points to a remote host.\n' +
    '   Integration tests are designed for local Supabase only.\n' +
    '   Set SKIP_INTEGRATION_TESTS=true to skip them, or use local Supabase.\n'
  );
  if (process.env.SKIP_INTEGRATION_TESTS !== 'true') {
    throw new Error('Refusing to run integration tests against remote Supabase. Set SKIP_INTEGRATION_TESTS=true to skip.');
  }
}

// Local Supabase demo keys (safe defaults)
export const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
export const LOCAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
export const LOCAL_SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
