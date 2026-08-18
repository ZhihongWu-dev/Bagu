export const MAX_HEARTS = 5;
export const RECENT_SESSION_LIMIT = 5;

export type LearningStreak = {
  current: number;
  lastCompletedLocalDate: string | null;
};

export type NodePerformanceEntry = {
  completedAt: string;
  correct: number;
  total: number;
  incorrectExerciseIds: string[];
};

export type NodeLearningStats = {
  recentSessions: NodePerformanceEntry[];
  exerciseUseCounts: Record<string, number>;
};

export type LearningMotivationProgress = {
  streak: LearningStreak;
  nodeStats: Record<string, NodeLearningStats>;
};

export type LessonPerformance = {
  completedAt: string;
  correct: number;
  total: number;
  incorrectExerciseIds: string[];
  baseExerciseIds: string[];
};

export const emptyLearningMotivationProgress = (): LearningMotivationProgress => ({
  streak: { current: 0, lastCompletedLocalDate: null },
  nodeStats: {},
});

export function applyHeartPenalty(currentHearts: number) {
  return Math.max(0, Math.min(MAX_HEARTS, Math.floor(currentHearts)) - 1);
}

export function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateStreak(current: LearningStreak, completedLocalDate: string): { streak: LearningStreak; advanced: boolean } {
  const completedDay = parseDateKey(completedLocalDate);
  const lastDay = current.lastCompletedLocalDate ? parseDateKey(current.lastCompletedLocalDate) : null;
  const normalizedCurrent = Math.max(0, Math.floor(current.current));

  if (completedDay === null) return { streak: { ...current, current: normalizedCurrent }, advanced: false };
  if (lastDay === null) {
    return { streak: { current: 1, lastCompletedLocalDate: completedLocalDate }, advanced: true };
  }

  const difference = completedDay - lastDay;
  if (difference < 0) return { streak: { ...current, current: normalizedCurrent }, advanced: false };
  if (difference === 0) return { streak: { current: normalizedCurrent, lastCompletedLocalDate: completedLocalDate }, advanced: false };
  if (difference === 1) {
    return { streak: { current: normalizedCurrent + 1, lastCompletedLocalDate: completedLocalDate }, advanced: true };
  }
  return { streak: { current: 1, lastCompletedLocalDate: completedLocalDate }, advanced: true };
}

export function calculateRecentAccuracy(entries: NodePerformanceEntry[]): number | null {
  const recent = entries
    .filter((entry) => Number.isFinite(entry.correct) && Number.isFinite(entry.total) && entry.total > 0)
    .slice(-RECENT_SESSION_LIMIT);
  const total = recent.reduce((sum, entry) => sum + entry.total, 0);
  if (total === 0) return null;
  const correct = recent.reduce((sum, entry) => sum + Math.min(entry.total, Math.max(0, entry.correct)), 0);
  return correct / total;
}

export function selectPracticeLength(entries: NodePerformanceEntry[]) {
  const accuracy = calculateRecentAccuracy(entries);
  if (accuracy === null) return 10;
  if (accuracy < 0.7) return 8;
  if (accuracy < 0.9) return 10;
  return 12;
}

export function recordNodePerformance(current: NodeLearningStats | undefined, performance: LessonPerformance): NodeLearningStats {
  const previous = normalizeNodeLearningStats(current);
  if (performance.total <= 0) return previous;

  const entry: NodePerformanceEntry = {
    completedAt: performance.completedAt,
    correct: Math.min(performance.total, Math.max(0, Math.floor(performance.correct))),
    total: Math.max(1, Math.floor(performance.total)),
    incorrectExerciseIds: uniqueStrings(performance.incorrectExerciseIds),
  };
  const exerciseUseCounts = { ...previous.exerciseUseCounts };
  uniqueStrings(performance.baseExerciseIds).forEach((exerciseId) => {
    exerciseUseCounts[exerciseId] = (exerciseUseCounts[exerciseId] ?? 0) + 1;
  });

  return {
    recentSessions: [...previous.recentSessions, entry].slice(-RECENT_SESSION_LIMIT),
    exerciseUseCounts,
  };
}

export function normalizeLearningMotivationProgress(value: unknown): LearningMotivationProgress {
  if (!isRecord(value)) return emptyLearningMotivationProgress();
  const streakValue = isRecord(value.streak) ? value.streak : {};
  const current = typeof streakValue.current === 'number' && Number.isFinite(streakValue.current)
    ? Math.max(0, Math.floor(streakValue.current))
    : 0;
  const lastCompletedLocalDate = typeof streakValue.lastCompletedLocalDate === 'string' && parseDateKey(streakValue.lastCompletedLocalDate) !== null
    ? streakValue.lastCompletedLocalDate
    : null;
  const nodeStats: Record<string, NodeLearningStats> = {};

  if (isRecord(value.nodeStats)) {
    Object.entries(value.nodeStats).forEach(([nodeId, stats]) => {
      if (nodeId) nodeStats[nodeId] = normalizeNodeLearningStats(stats);
    });
  }

  return { streak: { current, lastCompletedLocalDate }, nodeStats };
}

export function normalizeNodeLearningStats(value: unknown): NodeLearningStats {
  if (!isRecord(value)) return { recentSessions: [], exerciseUseCounts: {} };
  const recentSessions = Array.isArray(value.recentSessions)
    ? value.recentSessions.flatMap((entry): NodePerformanceEntry[] => {
        if (!isRecord(entry) || typeof entry.total !== 'number' || !Number.isFinite(entry.total) || entry.total <= 0) return [];
        const total = Math.max(1, Math.floor(entry.total));
        const correctValue = typeof entry.correct === 'number' && Number.isFinite(entry.correct) ? entry.correct : 0;
        return [{
          completedAt: typeof entry.completedAt === 'string' ? entry.completedAt : '',
          correct: Math.min(total, Math.max(0, Math.floor(correctValue))),
          total,
          incorrectExerciseIds: Array.isArray(entry.incorrectExerciseIds) ? uniqueStrings(entry.incorrectExerciseIds) : [],
        }];
      }).slice(-RECENT_SESSION_LIMIT)
    : [];
  const exerciseUseCounts: Record<string, number> = {};

  if (isRecord(value.exerciseUseCounts)) {
    Object.entries(value.exerciseUseCounts).forEach(([exerciseId, count]) => {
      if (exerciseId && typeof count === 'number' && Number.isFinite(count) && count >= 0) {
        exerciseUseCounts[exerciseId] = Math.floor(count);
      }
    });
  }

  return { recentSessions, exerciseUseCounts };
}

function parseDateKey(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
  return Math.floor(timestamp / 86_400_000);
}

function uniqueStrings(values: unknown[]) {
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.length > 0))];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
