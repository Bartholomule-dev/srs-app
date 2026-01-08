/**
 * Shared Supabase test utilities
 *
 * Provides service and anon clients, plus user creation/deletion helpers
 * for integration tests that need to interact with Supabase.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  LOCAL_SUPABASE_URL,
  LOCAL_SUPABASE_ANON_KEY,
  LOCAL_SUPABASE_SERVICE_KEY,
} from '../setup';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || LOCAL_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SUPABASE_SERVICE_KEY;

/**
 * Service client - bypasses RLS for test setup/teardown
 */
export const serviceClient: SupabaseClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

/**
 * Anon client - respects RLS, no user session
 */
export const anonClient: SupabaseClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
});

/**
 * Create a test user in auth.users (profile is auto-created by trigger)
 *
 * @returns The user ID of the created user
 *
 * @example
 * const userId = await createTestUser();
 * // Use the user...
 * await deleteTestUser(userId);
 */
export async function createTestUser(): Promise<string> {
  const { data, error } = await serviceClient.auth.admin.createUser({
    email: `test-${crypto.randomUUID()}@example.com`,
    email_confirm: true,
  });

  if (error) throw error;
  return data.user.id;
}

/**
 * Delete a test user (cascades to profile and related data)
 *
 * @param userId - The user ID to delete
 * @throws Error if deletion fails
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const { error } = await serviceClient.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(`Failed to delete test user ${userId}: ${error.message}`);
  }
}

/**
 * Create a test exercise in the database
 *
 * @param overrides - Optional overrides for exercise fields
 * @returns The created exercise's ID and slug
 */
export async function createTestExercise(
  overrides: Record<string, unknown> = {}
): Promise<{ id: string; slug: string }> {
  const slug = `test-exercise-${crypto.randomUUID()}`;
  const { data, error } = await serviceClient
    .from('exercises')
    .insert({
      language: 'python',
      category: 'test',
      difficulty: 1,
      title: 'Test Exercise',
      slug,
      prompt: 'Test prompt',
      expected_answer: 'test',
      ...overrides,
    })
    .select('id, slug')
    .single();

  if (error) throw new Error(`Failed to create test exercise: ${error.message}`);
  return { id: data.id, slug: data.slug };
}

/**
 * Delete a test exercise by ID
 *
 * @param exerciseId - The exercise ID to delete
 */
export async function deleteTestExercise(exerciseId: string): Promise<void> {
  await serviceClient.from('exercises').delete().eq('id', exerciseId);
}

/**
 * Delete a test exercise by slug
 *
 * @param slug - The exercise slug to delete
 */
export async function deleteTestExerciseBySlug(slug: string): Promise<void> {
  await serviceClient.from('exercises').delete().eq('slug', slug);
}
