/**
 * Benchmark gamification RPC functions
 * Run: npx tsx scripts/benchmark-gamification.ts [user-id]
 *
 * Performance targets:
 * - calculate_attempt_points: < 10ms avg
 * - update_streak: < 15ms avg
 * - get_points_summary: < 20ms avg
 * - get_contribution_history: < 50ms avg
 * - check_achievements: < 30ms avg
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BenchmarkResult {
  name: string;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  target: number;
  passed: boolean;
}

async function benchmark(
  name: string,
  fn: () => Promise<unknown>,
  targetMs: number,
  iterations = 100
): Promise<BenchmarkResult> {
  const times: number[] = [];

  // Warm up
  await fn();

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b) / times.length;
  const p50 = times[Math.floor(iterations * 0.5)];
  const p95 = times[Math.floor(iterations * 0.95)];
  const p99 = times[Math.floor(iterations * 0.99)];
  const passed = avg < targetMs;

  const status = passed ? '✓' : '✗';
  console.log(
    `${status} ${name.padEnd(28)} avg=${avg.toFixed(2).padStart(8)}ms  p50=${p50.toFixed(2).padStart(8)}ms  p95=${p95.toFixed(2).padStart(8)}ms  p99=${p99.toFixed(2).padStart(8)}ms  target=<${targetMs}ms`
  );

  return { name, avg, p50, p95, p99, target: targetMs, passed };
}

async function main() {
  console.log('Gamification RPC Benchmarks');
  console.log('='.repeat(100));
  console.log('');

  // Use a test user ID - pass as CLI argument or use placeholder
  const testUserId = process.argv[2] || 'test-user-id';
  console.log(`Using user ID: ${testUserId}`);
  console.log('');

  const results: BenchmarkResult[] = [];

  results.push(
    await benchmark(
      'calculate_attempt_points',
      async () => {
        await supabase.rpc('calculate_attempt_points', {
          p_user_id: testUserId,
          p_is_correct: true,
          p_rating: 3,
          p_used_hint: false,
          p_is_first_attempt: true,
          p_response_time_ms: 5000,
          p_subconcept_stability: 30,
        });
      },
      10 // target < 10ms
    )
  );

  results.push(
    await benchmark(
      'update_streak',
      async () => {
        await supabase.rpc('update_streak', {
          p_user_id: testUserId,
          p_activity_date: new Date().toISOString().split('T')[0],
        });
      },
      15 // target < 15ms
    )
  );

  results.push(
    await benchmark(
      'get_points_summary',
      async () => {
        await supabase.rpc('get_points_summary', {
          p_user_id: testUserId,
          p_start_date: '2026-01-01',
          p_end_date: '2026-01-08',
        });
      },
      20 // target < 20ms
    )
  );

  results.push(
    await benchmark(
      'get_contribution_history',
      async () => {
        await supabase.rpc('get_contribution_history', {
          p_user_id: testUserId,
          p_start_date: '2025-01-08',
          p_end_date: '2026-01-08',
        });
      },
      50 // target < 50ms
    )
  );

  results.push(
    await benchmark(
      'check_achievements',
      async () => {
        await supabase.rpc('check_achievements', {
          p_user_id: testUserId,
        });
      },
      30 // target < 30ms
    )
  );

  console.log('');
  console.log('='.repeat(100));

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  if (passed === total) {
    console.log(`All ${total} benchmarks passed!`);
  } else {
    console.log(`${passed}/${total} benchmarks passed`);
    console.log('');
    console.log('Failed benchmarks:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.avg.toFixed(2)}ms avg (target: <${r.target}ms)`);
      });
  }
}

main().catch(console.error);
