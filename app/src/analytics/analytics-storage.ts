import { normalizeAnalyticsState, type AnalyticsState } from '@/analytics/state';

const key = 'bagu-analytics-v1';

export async function loadAnalyticsState(): Promise<AnalyticsState> {
  if (typeof localStorage === 'undefined') return normalizeAnalyticsState(null);
  const raw = localStorage.getItem(key);
  if (!raw) return normalizeAnalyticsState(null);
  try {
    return normalizeAnalyticsState(JSON.parse(raw));
  } catch {
    return normalizeAnalyticsState(null);
  }
}

export async function saveAnalyticsState(state: AnalyticsState): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(state));
}
