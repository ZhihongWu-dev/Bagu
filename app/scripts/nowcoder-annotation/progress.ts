import type { SourceManifestEntry } from '../nowcoder-intake/types';
import type { AnnotationProgress, ManualAnnotation } from './types';

export function annotationProgress(sources: SourceManifestEntry[], annotations: Record<string, ManualAnnotation>): AnnotationProgress {
  let completed = 0;
  let skipped = 0;
  let nextSourceId: string | undefined;
  for (const source of sources) {
    const status = annotations[source.sourceId]?.status ?? 'pending';
    if (status === 'completed') completed += 1;
    else if (status === 'skipped') skipped += 1;
    else if (!nextSourceId) nextSourceId = source.sourceId;
  }
  const pending = sources.length - completed - skipped;
  return { total: sources.length, completed, pending, skipped, ...(nextSourceId ? { nextSourceId } : {}) };
}

export function nextPendingSourceId(sources: SourceManifestEntry[], annotations: Record<string, ManualAnnotation>, currentSourceId: string): string | undefined {
  const start = Math.max(0, sources.findIndex((source) => source.sourceId === currentSourceId));
  for (let offset = 1; offset <= sources.length; offset += 1) {
    const source = sources[(start + offset) % sources.length];
    if ((annotations[source.sourceId]?.status ?? 'pending') === 'pending') return source.sourceId;
  }
  return undefined;
}
