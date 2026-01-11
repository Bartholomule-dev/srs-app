// src/app/api/paths/route.ts
//
// API route to serve path index (blueprints, skins) for a specific language.
// Used by client-side code that needs to load paths for languages other than Python,
// or when dynamic loading is preferred over pre-generated JSON.

import { NextRequest, NextResponse } from 'next/server';
import { getPathIndex, clearPathIndexCache } from '@/lib/paths/loader';
import type { Blueprint, Skin, BlueprintRef } from '@/lib/paths/types';

// Serializable version of PathIndex (uses objects instead of Maps)
interface SerializedPathIndex {
  blueprints: Record<string, Blueprint>;
  skins: Record<string, Skin>;
  exerciseToBlueprints: Record<string, BlueprintRef[]>;
  exerciseToSkins: Record<string, string[]>;
}

/**
 * Convert PathIndex with Maps to serializable object
 */
function serializePathIndex(index: Awaited<ReturnType<typeof getPathIndex>>): SerializedPathIndex {
  return {
    blueprints: Object.fromEntries(index.blueprints),
    skins: Object.fromEntries(index.skins),
    exerciseToBlueprints: Object.fromEntries(index.exerciseToBlueprints),
    exerciseToSkins: Object.fromEntries(index.exerciseToSkins),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('language') ?? 'python';

  // Validate language parameter
  const validLanguages = ['python', 'javascript'];
  if (!validLanguages.includes(language)) {
    return NextResponse.json(
      { error: `Invalid language: ${language}. Valid options: ${validLanguages.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const index = await getPathIndex(language);
    const serialized = serializePathIndex(index);

    return NextResponse.json(serialized, {
      headers: {
        // Cache for 5 minutes on client, revalidate in background
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error(`Failed to load path index for ${language}:`, error);
    return NextResponse.json(
      { error: `Failed to load paths for ${language}` },
      { status: 500 }
    );
  }
}

// Optional: POST to clear cache (for development/testing)
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const language = body.language;

  if (language) {
    clearPathIndexCache(language);
  } else {
    clearPathIndexCache();
  }

  return NextResponse.json({ success: true, cleared: language ?? 'all' });
}
