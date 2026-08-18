import { normalizePersistedProgress, type PersistedProgress } from '@/storage/progress-data';

export type { PersistedProgress } from '@/storage/progress-data';

const key = 'bagu-progress-v1';

export async function loadProgress(): Promise<PersistedProgress | null> {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return normalizePersistedProgress(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveProgress(progress: PersistedProgress): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(progress));
}
