import { normalizeLearningMotivationProgress, type LearningMotivationProgress } from '@/domain/learning-motivation';
import type { ProjectProfile, ResumeAnalysisProfile, ResumeFileMeta, ReviewQueueItem, TargetRole } from '@/types/course';

export type PersistedProgress = {
  targetRole?: TargetRole | null;
  completedLessonIds: string[];
  nodeAttemptCounts?: Record<string, number>;
  xp: number;
  reviewSchedule: Record<string, string>;
  favoriteKnowledgeIds?: string[];
  reviewQueue?: ReviewQueueItem[];
  resumeFile?: ResumeFileMeta | null;
  projectProfile?: ProjectProfile | null;
  resumeAnalysis?: ResumeAnalysisProfile | null;
  soundEnabled?: boolean;
  learningMotivation?: LearningMotivationProgress;
};

export function normalizePersistedProgress(value: unknown): PersistedProgress | null {
  if (!isRecord(value)) return null;
  return {
    targetRole: isTargetRole(value.targetRole) ? value.targetRole : null,
    completedLessonIds: stringArray(value.completedLessonIds),
    nodeAttemptCounts: numberRecord(value.nodeAttemptCounts),
    xp: finiteNonNegative(value.xp),
    reviewSchedule: stringRecord(value.reviewSchedule),
    favoriteKnowledgeIds: stringArray(value.favoriteKnowledgeIds),
    reviewQueue: Array.isArray(value.reviewQueue) ? value.reviewQueue as ReviewQueueItem[] : [],
    resumeFile: isRecord(value.resumeFile) ? value.resumeFile as ResumeFileMeta : null,
    projectProfile: isRecord(value.projectProfile) ? value.projectProfile as ProjectProfile : null,
    resumeAnalysis: normalizeResumeAnalysis(value.resumeAnalysis),
    soundEnabled: typeof value.soundEnabled === 'boolean' ? value.soundEnabled : true,
    learningMotivation: normalizeLearningMotivationProgress(value.learningMotivation),
  };
}

function isTargetRole(value: unknown): value is TargetRole {
  return value === 'llm_algorithm' || value === 'llm_application';
}

function normalizeResumeAnalysis(value: unknown): ResumeAnalysisProfile | null {
  if (!isRecord(value) || typeof value.sourceName !== 'string') return null;
  return {
    sourceName: value.sourceName.slice(0, 180),
    experienceType: typeof value.experienceType === 'string' ? value.experienceType.slice(0, 120) : '项目经历',
    technologies: stringArray(value.technologies).slice(0, 30),
    responsibilities: stringArray(value.responsibilities).slice(0, 20),
    scale: typeof value.scale === 'string' ? value.scale.slice(0, 300) : undefined,
    metrics: stringArray(value.metrics).slice(0, 20),
    topicIds: stringArray(value.topicIds).filter((id) => id.startsWith('app-')).slice(0, 30),
    followUps: stringArray(value.followUps).slice(0, 20),
    confidence: typeof value.confidence === 'number' && Number.isFinite(value.confidence) ? Math.max(0, Math.min(1, value.confidence)) : 0,
    analyzedAt: typeof value.analyzedAt === 'string' ? value.analyzedAt : new Date(0).toISOString(),
    confirmed: value.confirmed === true,
  };
}

function finiteNonNegative(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0))]
    : [];
}

function stringRecord(value: unknown) {
  const result: Record<string, string> = {};
  if (!isRecord(value)) return result;
  Object.entries(value).forEach(([key, item]) => {
    if (key && typeof item === 'string') result[key] = item;
  });
  return result;
}

function numberRecord(value: unknown) {
  const result: Record<string, number> = {};
  if (!isRecord(value)) return result;
  Object.entries(value).forEach(([key, item]) => {
    if (key && typeof item === 'number' && Number.isFinite(item) && item >= 0) result[key] = Math.floor(item);
  });
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
