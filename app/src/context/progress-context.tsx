import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { transformerLessons } from '@/data/transformer-course';
import { loadProgress, saveProgress } from '@/storage/progress-storage';

type ProgressContextValue = {
  completedLessonIds: string[];
  xp: number;
  streak: number;
  focus: number;
  reviewSchedule: Record<string, string>;
  completeLesson: (lessonId: string, earnedXp: number) => void;
  isUnlocked: (lessonId: string) => boolean;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: PropsWithChildren) {
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [xp, setXp] = useState(420);
  const [reviewSchedule, setReviewSchedule] = useState<Record<string, string>>({});
  const completedRef = useRef<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    loadProgress()
      .then((stored) => {
        if (!active || !stored) return;
        completedRef.current = stored.completedLessonIds;
        setCompletedLessonIds(stored.completedLessonIds);
        setXp(stored.xp);
        setReviewSchedule(stored.reviewSchedule);
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void saveProgress({ completedLessonIds, xp, reviewSchedule });
  }, [completedLessonIds, hydrated, reviewSchedule, xp]);

  const completeLesson = useCallback((lessonId: string, earnedXp: number) => {
    if (completedRef.current.includes(lessonId)) return;
    const nextCompleted = [...completedRef.current, lessonId];
    completedRef.current = nextCompleted;
    setCompletedLessonIds(nextCompleted);
    setXp((currentXp) => currentXp + earnedXp);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setReviewSchedule((current) => ({ ...current, [lessonId]: tomorrow.toISOString() }));
  }, []);

  const isUnlocked = useCallback(
    (lessonId: string) => {
      const index = transformerLessons.findIndex((lesson) => lesson.id === lessonId);
      if (index <= 0) return true;
      return completedLessonIds.includes(transformerLessons[index - 1].id);
    },
    [completedLessonIds],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      completedLessonIds,
      xp,
      streak: 7,
      focus: 5,
      reviewSchedule,
      completeLesson,
      isUnlocked,
    }),
    [completeLesson, completedLessonIds, isUnlocked, reviewSchedule, xp],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const value = useContext(ProgressContext);
  if (!value) throw new Error('useProgress must be used inside ProgressProvider');
  return value;
}
