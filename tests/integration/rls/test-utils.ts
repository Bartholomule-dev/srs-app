import { createClient } from '@supabase/supabase-js';
import {
  LOCAL_SUPABASE_URL,
  LOCAL_SUPABASE_ANON_KEY,
  LOCAL_SUPABASE_SERVICE_KEY,
} from '../../setup';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || LOCAL_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SUPABASE_SERVICE_KEY;

/**
 * Service client - bypasses RLS
 */
export const serviceClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

/**
 * Anon client - respects RLS, no user
 */
export const anonClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
});

/**
 * Create a test user in auth.users and profiles
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
 * Delete a test user
 */
export async function deleteTestUser(userId: string): Promise<void> {
  await serviceClient.auth.admin.deleteUser(userId);
}
