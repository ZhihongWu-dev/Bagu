export type PersistedProgress = {
  completedLessonIds: string[];
  xp: number;
  reviewSchedule: Record<string, string>;
};

const key = 'bagu-progress-v1';

export async function loadProgress(): Promise<PersistedProgress | null> {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedProgress;
  } catch {
    return null;
  }
}

export async function saveProgress(progress: PersistedProgress): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(progress));
}

