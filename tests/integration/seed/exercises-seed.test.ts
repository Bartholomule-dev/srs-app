import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  LOCAL_SUPABASE_URL,
  LOCAL_SUPABASE_SERVICE_KEY,
} from '../../setup';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

describe('Exercise Seed Data', () => {
  it('has Python exercises seeded', async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('id')
      .eq('language', 'python');

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(10);
  });

  it('has exercises in multiple categories', async () => {
    const { data } = await supabase
      .from('exercises')
      .select('category')
      .eq('language', 'python');

    const categories = new Set(data!.map(e => e.category));
    expect(categories.size).toBeGreaterThanOrEqual(4);
  });

  it('has exercises at different difficulty levels', async () => {
    const { data } = await supabase
      .from('exercises')
      .select('difficulty')
      .eq('language', 'python');

    const difficulties = new Set(data!.map(e => e.difficulty));
    expect(difficulties.size).toBeGreaterThanOrEqual(2);
  });
});
