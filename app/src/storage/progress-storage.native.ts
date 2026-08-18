import { File, Paths } from 'expo-file-system';

import { normalizePersistedProgress, type PersistedProgress } from './progress-data';

const progressFile = new File(Paths.document, 'bagu-progress-v1.json');

export async function loadProgress(): Promise<PersistedProgress | null> {
  if (!progressFile.exists) return null;
  try {
    return normalizePersistedProgress(JSON.parse(await progressFile.text()));
  } catch {
    return null;
  }
}

export async function saveProgress(progress: PersistedProgress): Promise<void> {
  progressFile.write(JSON.stringify(progress));
}
