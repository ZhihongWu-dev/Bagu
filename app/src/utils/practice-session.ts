import type { Exercise, LearningNode } from '@/types/course';
import { calculateRecentAccuracy, selectPracticeLength, type NodeLearningStats } from '@/domain/learning-motivation';

export type PracticeItem = {
  key: string;
  exercise: Exercise;
  isReview: boolean;
};

export function buildPracticeSession(node: LearningNode, attemptSeed: number, limit = 8): PracticeItem[] {
  const pool = node.exercises;
  if (pool.length === 0) return [];
  const count = Math.min(limit, pool.length);
  const offset = ((attemptSeed * 3) % pool.length + pool.length) % pool.length;
  return Array.from({ length: count }, (_, index) => {
    const exercise = pool[(offset + index) % pool.length];
    return { key: `base-${exercise.id}`, exercise, isReview: false };
  });
}

export function buildAdaptivePracticeSession(node: LearningNode, attemptSeed: number, stats?: NodeLearningStats): PracticeItem[] {
  const limit = selectPracticeLength(stats?.recentSessions ?? []);
  const accuracy = calculateRecentAccuracy(stats?.recentSessions ?? []);
  const recentWrongIds = new Set(stats?.recentSessions.flatMap((entry) => entry.incorrectExerciseIds) ?? []);
  const useCounts = stats?.exerciseUseCounts ?? {};
  const rotatedPool = rotate(node.exercises, attemptSeed * 3);
  const prioritized = rotatedPool
    .map((exercise, stableIndex) => ({ exercise, stableIndex }))
    .sort((left, right) => {
      const leftWrong = recentWrongIds.has(left.exercise.id);
      const rightWrong = recentWrongIds.has(right.exercise.id);
      if (accuracy !== null && accuracy < 0.9 && leftWrong !== rightWrong) return leftWrong ? -1 : 1;
      const useDifference = (useCounts[left.exercise.id] ?? 0) - (useCounts[right.exercise.id] ?? 0);
      return useDifference || left.stableIndex - right.stableIndex;
    })
    .map(({ exercise }) => exercise);

  return prioritized.slice(0, Math.min(limit, prioritized.length)).map((exercise) => ({
    key: `base-${exercise.id}`,
    exercise,
    isReview: false,
  }));
}

export function restartPracticeSession(session: PracticeItem[], retrySeed: number): PracticeItem[] {
  const baseItems = session.filter((item) => !item.isReview);
  return rotate(baseItems, retrySeed).map((item) => ({ ...item }));
}

export function appendWrongReview(session: PracticeItem[], current: PracticeItem): PracticeItem[] {
  if (current.isReview) return session;
  const reviewKey = `review-${current.exercise.id}`;
  if (session.some((item) => item.key === reviewKey)) return session;
  return [...session, { key: reviewKey, exercise: current.exercise, isReview: true }];
}

export function getPracticeProgress(completedCount: number, totalCount: number) {
  if (totalCount <= 0) return 0;
  return Math.max(0, Math.min(1, completedCount / totalCount));
}

function rotate<T>(items: T[], offsetSeed: number) {
  if (items.length === 0) return [];
  const offset = ((offsetSeed % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}
