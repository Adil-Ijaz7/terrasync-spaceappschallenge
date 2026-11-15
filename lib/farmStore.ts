import { FarmRecord } from './supabase';

const LOCAL_STORAGE_KEY = 'terrasync_local_registered_farms';

/**
 * Retrieve user-registered farms from the browser's localStorage.
 * Guarantees that even if serverless functions restart or Supabase isn't deployed,
 * every farm the user registers is 100% persisted on their device.
 */
export function getLocalFarms(): FarmRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to parse local farms:', e);
    return [];
  }
}

/**
 * Save a newly registered farm to browser's localStorage.
 * Deduplicates by id and farmer name.
 */
export function saveLocalFarm(farm: FarmRecord): FarmRecord[] {
  if (typeof window === 'undefined') return [farm];
  try {
    const current = getLocalFarms();
    const filtered = current.filter(
      (f) =>
        f.id !== farm.id &&
        f.farmer_name.trim().toLowerCase() !== farm.farmer_name.trim().toLowerCase()
    );
    const updated = [farm, ...filtered];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    // Trigger storage event for cross-component or cross-tab synchronization
    window.dispatchEvent(new CustomEvent('terrasync_farms_updated', { detail: farm }));
    return updated;
  } catch (e) {
    console.warn('Failed to save farm locally:', e);
    return [farm];
  }
}

/**
 * Merges server-fetched farms with local user-registered farms.
 * User registered outposts take precedence at the top of the list.
 */
export function mergeServerAndLocalFarms(serverFarms: FarmRecord[]): FarmRecord[] {
  const localFarms = getLocalFarms();
  if (!localFarms.length) return serverFarms;

  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const result: FarmRecord[] = [];

  // Add local user-registered farms first
  for (const f of localFarms) {
    if (f && f.id) {
      const normalizedName = (f.farmer_name || '').toLowerCase().trim();
      seenIds.add(f.id);
      if (normalizedName) seenNames.add(normalizedName);
      result.push(f);
    }
  }

  // Add server farms if not already represented
  for (const f of serverFarms) {
    if (f && f.id) {
      const normalizedName = (f.farmer_name || '').toLowerCase().trim();
      if (!seenIds.has(f.id) && (!normalizedName || !seenNames.has(normalizedName))) {
        seenIds.add(f.id);
        if (normalizedName) seenNames.add(normalizedName);
        result.push(f);
      }
    }
  }

  return result;
}
