import type { SourceManifest } from '../nowcoder-intake/types';
import type { ManualAnnotationDataset } from './types';

export function csvCell(value: unknown): string {
  const text = Array.isArray(value) ? value.join('|') : value == null ? '' : String(value);
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function annotationsToCsv(manifest: SourceManifest, dataset: ManualAnnotationDataset): string {
  const columns = ['sourceId', 'url', 'pageType', 'status', 'relevance', 'role', 'recruitingStage', 'topicIds', 'followUpTypes', 'misconceptionTypes', 'cognitiveLevel', 'distractorTypes', 'answerCueTypes', 'summary', 'skipReason', 'skipNote', 'updatedAt'] as const;
  const rows = manifest.sources.map((source) => {
    const annotation = dataset.annotations[source.sourceId];
    const row: Record<(typeof columns)[number], unknown> = {
      sourceId: source.sourceId, url: source.url, pageType: source.pageType, status: annotation?.status ?? 'pending',
      relevance: annotation?.relevance, role: annotation?.role, recruitingStage: annotation?.recruitingStage,
      topicIds: annotation?.topicIds, followUpTypes: annotation?.followUpTypes, misconceptionTypes: annotation?.misconceptionTypes,
      cognitiveLevel: annotation?.choiceSignals?.cognitiveLevel, distractorTypes: annotation?.choiceSignals?.distractorTypes,
      answerCueTypes: annotation?.choiceSignals?.answerCueTypes, summary: annotation?.summary, skipReason: annotation?.skipReason,
      skipNote: annotation?.skipNote, updatedAt: annotation?.updatedAt,
    };
    return columns.map((column) => csvCell(row[column])).join(',');
  });
  return [columns.map(csvCell).join(','), ...rows].join('\r\n') + '\r\n';
}
