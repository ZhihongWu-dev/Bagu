import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getLessonOrder } from '@/data/course-catalog';
import {
  calculateStreak,
  emptyLearningMotivationProgress,
  getLocalDateKey,
  recordNodePerformance,
  type LearningMotivationProgress,
  type LessonPerformance,
  type NodeLearningStats,
} from '@/domain/learning-motivation';
import { hasCompletedPrerequisites, repairSequentialCompletions } from '@/domain/course-progression';
import { loadProgress, saveProgress } from '@/storage/progress-storage';
import type { ProjectProfile, ResumeAnalysisProfile, ResumeFileMeta, ReviewQueueItem, ReviewSource, TargetRole } from '@/types/course';

export type LessonCompletionResult = {
  streak: number;
  streakAdvanced: boolean;
};

type ProgressContextValue = {
  hydrated: boolean;
  targetRole: TargetRole | null;
  completedLessonIds: string[];
  xp: number;
  streak: number;
  reviewSchedule: Record<string, string>;
  favoriteKnowledgeIds: string[];
  reviewQueue: ReviewQueueItem[];
  resumeFile: ResumeFileMeta | null;
  projectProfile: ProjectProfile | null;
  resumeAnalysis: ResumeAnalysisProfile | null;
  soundEnabled: boolean;
  nodeAttemptCounts: Record<string, number>;
  nodeLearningStats: Record<string, NodeLearningStats>;
  completeLesson: (lessonId: string, earnedXp: number, performance: LessonPerformance) => LessonCompletionResult;
  isUnlocked: (lessonId: string) => boolean;
  toggleFavorite: (knowledgeId: string) => void;
  addToReview: (targetId: string, source?: ReviewSource) => void;
  removeFromReview: (reviewItemId: string) => void;
  setResumeFile: (file: ResumeFileMeta | null) => void;
  saveProjectProfile: (profile: ProjectProfile | null) => void;
  saveResumeAnalysis: (profile: ResumeAnalysisProfile | null) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setTargetRole: (role: TargetRole) => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: PropsWithChildren) {
  const [targetRole, setTargetRole] = useState<TargetRole | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [xp, setXp] = useState(0);
  const [reviewSchedule, setReviewSchedule] = useState<Record<string, string>>({});
  const [favoriteKnowledgeIds, setFavoriteKnowledgeIds] = useState<string[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [resumeFile, setResumeFileState] = useState<ResumeFileMeta | null>(null);
  const [projectProfile, setProjectProfile] = useState<ProjectProfile | null>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysisProfile | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [nodeAttemptCounts, setNodeAttemptCounts] = useState<Record<string, number>>({});
  const [learningMotivation, setLearningMotivation] = useState<LearningMotivationProgress>(emptyLearningMotivationProgress);
  const completedRef = useRef<string[]>([]);
  const learningMotivationRef = useRef(learningMotivation);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    loadProgress()
      .then((stored) => {
        if (!active || !stored) return;
        const repairedCompletions = repairSequentialCompletions(
          [getLessonOrder('llm_algorithm'), getLessonOrder('llm_application')],
          stored.completedLessonIds,
        );
        setTargetRole(stored.targetRole ?? null);
        completedRef.current = repairedCompletions;
        setCompletedLessonIds(repairedCompletions);
        setXp(stored.xp);
        setReviewSchedule(stored.reviewSchedule);
        setFavoriteKnowledgeIds(stored.favoriteKnowledgeIds ?? []);
        setReviewQueue(stored.reviewQueue ?? []);
        setResumeFileState(stored.resumeFile ?? null);
        setProjectProfile(stored.projectProfile ?? null);
        setResumeAnalysis(stored.resumeAnalysis ?? null);
        setSoundEnabled(stored.soundEnabled ?? true);
        setNodeAttemptCounts(stored.nodeAttemptCounts ?? {});
        const storedMotivation = stored.learningMotivation ?? emptyLearningMotivationProgress();
        learningMotivationRef.current = storedMotivation;
        setLearningMotivation(storedMotivation);
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
    void saveProgress({ targetRole, completedLessonIds, nodeAttemptCounts, xp, reviewSchedule, favoriteKnowledgeIds, reviewQueue, resumeFile, projectProfile, resumeAnalysis, soundEnabled, learningMotivation }).catch(() => undefined);
  }, [completedLessonIds, favoriteKnowledgeIds, hydrated, learningMotivation, nodeAttemptCounts, projectProfile, resumeAnalysis, resumeFile, reviewQueue, reviewSchedule, soundEnabled, targetRole, xp]);

  const completeLesson = useCallback((lessonId: string, earnedXp: number, performance: LessonPerformance): LessonCompletionResult => {
    const completedAt = new Date(performance.completedAt);
    const completionDate = getLocalDateKey(Number.isNaN(completedAt.getTime()) ? new Date() : completedAt);
    const streakResult = calculateStreak(learningMotivationRef.current.streak, completionDate);
    const nextMotivation: LearningMotivationProgress = {
      streak: streakResult.streak,
      nodeStats: {
        ...learningMotivationRef.current.nodeStats,
        [lessonId]: recordNodePerformance(learningMotivationRef.current.nodeStats[lessonId], performance),
      },
    };
    learningMotivationRef.current = nextMotivation;
    setLearningMotivation(nextMotivation);
    setNodeAttemptCounts((current) => ({ ...current, [lessonId]: (current[lessonId] ?? 0) + 1 }));
    if (!completedRef.current.includes(lessonId)) {
      const nextCompleted = [...completedRef.current, lessonId];
      completedRef.current = nextCompleted;
      setCompletedLessonIds(nextCompleted);
    }
    setXp((currentXp) => currentXp + Math.max(0, Math.floor(earnedXp)));

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setReviewSchedule((current) => ({ ...current, [lessonId]: tomorrow.toISOString() }));
    setReviewQueue((current) => {
      const existing = current.find((item) => item.source === 'lesson' && item.targetId === lessonId);
      if (existing) return current.map((item) => item.id === existing.id ? { ...item, dueAt: tomorrow.toISOString() } : item);
      return [...current, { id: `lesson-${lessonId}`, source: 'lesson', targetId: lessonId, dueAt: tomorrow.toISOString() }];
    });
    return { streak: streakResult.streak.current, streakAdvanced: streakResult.advanced };
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
    (lessonId: string) => Boolean(targetRole && hasCompletedPrerequisites(lessonId, getLessonOrder(targetRole), completedLessonIds)),
    [completedLessonIds, targetRole],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      hydrated,
      targetRole,
      completedLessonIds,
      xp,
      streak: learningMotivation.streak.current,
      reviewSchedule,
      favoriteKnowledgeIds,
      reviewQueue,
      resumeFile,
      projectProfile,
      resumeAnalysis,
      soundEnabled,
      nodeAttemptCounts,
      nodeLearningStats: learningMotivation.nodeStats,
      completeLesson,
      isUnlocked,
      toggleFavorite,
      addToReview,
      removeFromReview,
      setResumeFile: setResumeFileState,
      saveProjectProfile: setProjectProfile,
      saveResumeAnalysis: setResumeAnalysis,
      setSoundEnabled,
      setTargetRole,
    }),
    [addToReview, completeLesson, completedLessonIds, favoriteKnowledgeIds, hydrated, isUnlocked, learningMotivation, nodeAttemptCounts, projectProfile, removeFromReview, resumeAnalysis, resumeFile, reviewQueue, reviewSchedule, soundEnabled, targetRole, toggleFavorite, xp],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const value = useContext(ProgressContext);
  if (!value) throw new Error('useProgress must be used inside ProgressProvider');
  return value;
}
