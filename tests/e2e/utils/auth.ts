import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

export async function createTestUser(): Promise<TestUser> {
  const email = `test-${Date.now()}@example.com`;
  const password = 'test-password-123';

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw new Error(`Failed to create test user: ${error.message}`);

  return { id: data.user.id, email, password };
}

export async function deleteTestUser(userId: string): Promise<void> {
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) console.warn(`Failed to delete test user: ${error.message}`);
}
