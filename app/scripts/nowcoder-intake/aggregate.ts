import type { SourceSignal, TopicId } from './types';

export interface TopicSummary {
  sourceCount: number;
  uniqueContentCount: number;
  pageTypes: Record<string, number>;
  roles: Record<string, number>;
  topics: Partial<Record<TopicId, number>>;
  priorityGaps: TopicId[];
}

export function aggregateSignals(signals: SourceSignal[]): TopicSummary {
  const unique = new Map<string, SourceSignal>();
  for (const signal of signals) if (!unique.has(signal.contentHash)) unique.set(signal.contentHash, signal);
  const pageTypes: Record<string, number> = {};
  const roles: Record<string, number> = {};
  const topics: Partial<Record<TopicId, number>> = {};
  for (const signal of unique.values()) {
    pageTypes[signal.pageType] = (pageTypes[signal.pageType] ?? 0) + 1;
    roles[signal.role] = (roles[signal.role] ?? 0) + 1;
    for (const topic of signal.topicIds) topics[topic] = (topics[topic] ?? 0) + 1;
  }
  const priorityGaps = (Object.entries(topics) as [TopicId, number][]).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([topic]) => topic);
  return { sourceCount: signals.length, uniqueContentCount: unique.size, pageTypes, roles, topics, priorityGaps };
}
