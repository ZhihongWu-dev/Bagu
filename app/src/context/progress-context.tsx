import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { transformerLessons } from '@/data/transformer-course';
import { loadProgress, saveProgress } from '@/storage/progress-storage';
import type { ProjectProfile, ResumeFileMeta, ReviewQueueItem, ReviewSource } from '@/types/course';

type ProgressContextValue = {
  completedLessonIds: string[];
  xp: number;
  streak: number;
  focus: number;
  reviewSchedule: Record<string, string>;
  favoriteKnowledgeIds: string[];
  reviewQueue: ReviewQueueItem[];
  resumeFile: ResumeFileMeta | null;
  projectProfile: ProjectProfile | null;
  completeLesson: (lessonId: string, earnedXp: number) => void;
  isUnlocked: (lessonId: string) => boolean;
  toggleFavorite: (knowledgeId: string) => void;
  addToReview: (targetId: string, source?: ReviewSource) => void;
  removeFromReview: (reviewItemId: string) => void;
  setResumeFile: (file: ResumeFileMeta | null) => void;
  saveProjectProfile: (profile: ProjectProfile | null) => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: PropsWithChildren) {
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [xp, setXp] = useState(420);
  const [reviewSchedule, setReviewSchedule] = useState<Record<string, string>>({});
  const [favoriteKnowledgeIds, setFavoriteKnowledgeIds] = useState<string[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [resumeFile, setResumeFileState] = useState<ResumeFileMeta | null>(null);
  const [projectProfile, setProjectProfile] = useState<ProjectProfile | null>(null);
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
        setFavoriteKnowledgeIds(stored.favoriteKnowledgeIds ?? []);
        setReviewQueue(stored.reviewQueue ?? []);
        setResumeFileState(stored.resumeFile ?? null);
        setProjectProfile(stored.projectProfile ?? null);
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
    void saveProgress({ completedLessonIds, xp, reviewSchedule, favoriteKnowledgeIds, reviewQueue, resumeFile, projectProfile });
  }, [completedLessonIds, favoriteKnowledgeIds, hydrated, projectProfile, resumeFile, reviewQueue, reviewSchedule, xp]);

  const completeLesson = useCallback((lessonId: string, earnedXp: number) => {
    if (completedRef.current.includes(lessonId)) return;
    const nextCompleted = [...completedRef.current, lessonId];
    completedRef.current = nextCompleted;
    setCompletedLessonIds(nextCompleted);
    setXp((currentXp) => currentXp + earnedXp);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setReviewSchedule((current) => ({ ...current, [lessonId]: tomorrow.toISOString() }));
    setReviewQueue((current) => {
      if (current.some((item) => item.source === 'lesson' && item.targetId === lessonId)) return current;
      return [...current, { id: `lesson-${lessonId}`, source: 'lesson', targetId: lessonId, dueAt: tomorrow.toISOString() }];
    });
  }, []);

  const toggleFavorite = useCallback((knowledgeId: string) => {
    setFavoriteKnowledgeIds((current) => current.includes(knowledgeId)
      ? current.filter((id) => id !== knowledgeId)
      : [...current, knowledgeId]);
  }, []);

  const addToReview = useCallback((targetId: string, source: ReviewSource = 'knowledge') => {
    setReviewQueue((current) => {
      if (current.some((item) => item.source === source && item.targetId === targetId)) return current;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return [...current, { id: `${source}-${targetId}`, source, targetId, dueAt: tomorrow.toISOString() }];
    });
  }, []);

  const removeFromReview = useCallback((reviewItemId: string) => {
    setReviewQueue((current) => current.filter((item) => item.id !== reviewItemId));
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
      favoriteKnowledgeIds,
      reviewQueue,
      resumeFile,
      projectProfile,
      completeLesson,
      isUnlocked,
      toggleFavorite,
      addToReview,
      removeFromReview,
      setResumeFile: setResumeFileState,
      saveProjectProfile: setProjectProfile,
    }),
    [addToReview, completeLesson, completedLessonIds, favoriteKnowledgeIds, isUnlocked, projectProfile, removeFromReview, resumeFile, reviewQueue, reviewSchedule, toggleFavorite, xp],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const value = useContext(ProgressContext);
  if (!value) throw new Error('useProgress must be used inside ProgressProvider');
  return value;
}
