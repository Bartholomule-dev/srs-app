const MAX_RECENT_SKINS = 10;

/**
 * Compute new recent skins array (pure function for testing)
 */
export function computeNewRecentSkins(
  current: string[],
  newSkin: string | null
): string[] {
  if (!newSkin) {
    return current;
  }

  // Remove existing occurrence to avoid duplicates
  const filtered = current.filter(id => id !== newSkin);

  // Add to end
  const updated = [...filtered, newSkin];

  // Trim to max size
  if (updated.length > MAX_RECENT_SKINS) {
    return updated.slice(-MAX_RECENT_SKINS);
  }

  return updated;
}

/**
 * Update user's recent skins in database
 */
export async function updateRecentSkins(
  userId: string,
  currentSkins: string[],
  newSkin: string | null
): Promise<string[]> {
  const newList = computeNewRecentSkins(currentSkins, newSkin);

  if (newList === currentSkins) {
    return currentSkins;
  }

  // Dynamic import to avoid side effects at module load time
  const { supabase } = await import('@/lib/supabase/client');

  const { error } = await supabase
    .from('profiles')
    .update({ recent_skins: newList })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update recent_skins:', error);
    // Return new list anyway for optimistic update
  }

  return newList;
}
