import { File, Paths } from 'expo-file-system';

import { normalizeAnalyticsState, type AnalyticsState } from '@/analytics/state';

const analyticsFile = new File(Paths.document, 'bagu-analytics-v1.json');

export async function loadAnalyticsState(): Promise<AnalyticsState> {
  if (!analyticsFile.exists) return normalizeAnalyticsState(null);
  try {
    return normalizeAnalyticsState(JSON.parse(await analyticsFile.text()));
  } catch {
    return normalizeAnalyticsState(null);
  }
}

export async function saveAnalyticsState(state: AnalyticsState): Promise<void> {
  analyticsFile.write(JSON.stringify(state));
}
