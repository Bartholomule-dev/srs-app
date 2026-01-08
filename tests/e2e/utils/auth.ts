import { createClient } from '@supabase/supabase-js';
import { Page } from '@playwright/test';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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

/**
 * Authenticate a test user and inject session cookies into Playwright browser context.
 * This centralizes the auth flow for all E2E tests.
 */
export async function authenticateUser(page: Page, user: TestUser): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (signInError) {
    throw new Error(`Failed to sign in: ${signInError.message}`);
  }

  const session = signInData.session;
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  await page.context().addCookies([
    {
      name: cookieName,
      value: encodeURIComponent(JSON.stringify(session)),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Authenticate a test user into a specific browser context (for multi-context tests).
 * Use this when you need to authenticate multiple users in parallel or need context-level auth.
 */
export async function authenticateContext(context: import('@playwright/test').BrowserContext, user: TestUser): Promise<void> {
  // Create fresh client to avoid connection pooling issues
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (signInError) {
    throw new Error(`Failed to sign in for ${user.email}: ${signInError.message}`);
  }

  if (!signInData.session) {
    throw new Error(`No session returned for ${user.email}`);
  }

  const session = signInData.session;
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  await context.addCookies([
    {
      name: cookieName,
      value: encodeURIComponent(JSON.stringify(session)),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Small delay to ensure cookies are properly set before navigation
  await new Promise((resolve) => setTimeout(resolve, 200));
}
