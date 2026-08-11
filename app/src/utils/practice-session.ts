import type { Exercise, LearningNode } from '@/types/course';

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
