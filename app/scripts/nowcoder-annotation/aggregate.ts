import type { SourceManifest } from '../nowcoder-intake/types';
import { annotationProgress } from './progress';
import type { AnnotationReport, ManualAnnotationDataset, TopicSummary } from './types';

function increment(record: Record<string, number>, key: string): void {
  record[key] = (record[key] ?? 0) + 1;
}

export function buildAnnotationReport(manifest: SourceManifest, dataset: ManualAnnotationDataset, generatedAt = new Date().toISOString()): AnnotationReport {
  const progress = annotationProgress(manifest.sources, dataset.annotations);
  let relevant = 0;
  let notRelevant = 0;
  let uncertain = 0;
  for (const annotation of Object.values(dataset.annotations)) {
    if (annotation.status !== 'completed') continue;
    if (annotation.relevance === 'relevant') relevant += 1;
    else if (annotation.relevance === 'not-relevant') notRelevant += 1;
    else if (annotation.relevance === 'uncertain') uncertain += 1;
  }
  return { schemaVersion: 1, ...progress, relevant, notRelevant, uncertain, generatedAt };
}

export function buildTopicSummary(manifest: SourceManifest, dataset: ManualAnnotationDataset, generatedAt = new Date().toISOString()): TopicSummary {
  const sources = new Map(manifest.sources.map((source) => [source.sourceId, source]));
  const summary: TopicSummary = { schemaVersion: 1, generatedAt, contributingSources: 0, byRole: {}, byPageType: {}, byTopic: {}, byFollowUpType: {} };
  for (const annotation of Object.values(dataset.annotations)) {
    if (annotation.status !== 'completed' || annotation.relevance !== 'relevant') continue;
    const source = sources.get(annotation.sourceId);
    if (!source) continue;
    summary.contributingSources += 1;
    increment(summary.byRole, annotation.role!);
    increment(summary.byPageType, source.pageType);
    for (const topic of new Set(annotation.topicIds ?? [])) increment(summary.byTopic, topic);
    for (const followUp of new Set(annotation.followUpTypes ?? [])) increment(summary.byFollowUpType, followUp);
  }
  return summary;
}
