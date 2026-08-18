import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAnalytics } from '@/analytics/analytics-context';
import { AppIcon } from '@/components/app-icon';
import { ExerciseFeedback } from '@/components/exercise-feedback';
import { ExercisePrompt } from '@/components/exercise-prompt';
import { ExerciseResponse } from '@/components/exercise-response';
import { KeywordSheet } from '@/components/keyword-sheet';
import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { findLearningNode } from '@/data/course-catalog';
import { keywords } from '@/data/transformer-course';
import { applyHeartPenalty, MAX_HEARTS } from '@/domain/learning-motivation';
import { useAnswerSounds } from '@/hooks/use-feedback-sounds';
import { colors } from '@/theme/colors';
import type { KnowledgeKeyword } from '@/types/course';
import { isExerciseAnswerCorrect, isExerciseReady } from '@/utils/exercise';
import { appendWrongReview, buildAdaptivePracticeSession, getPracticeProgress, restartPracticeSession } from '@/utils/practice-session';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const node = useMemo(() => findLearningNode(id), [id]);
  const { consent, track } = useAnalytics();
  const { completedLessonIds, hydrated, isUnlocked, nodeAttemptCounts, nodeLearningStats } = useProgress();
  const [session, setSession] = useState(() => node ? buildAdaptivePracticeSession(node, nodeAttemptCounts[node.id] ?? 0, nodeLearningStats[node.id]) : []);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [failed, setFailed] = useState(false);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [activeKeyword, setActiveKeyword] = useState<KnowledgeKeyword | null>(null);
  const { playCorrect, playWrong } = useAnswerSounds();
  const currentItem = session[exerciseIndex];
  const exercise = currentItem?.exercise;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const heartAnimation = useRef(new Animated.Value(1)).current;
  const submissionLocked = useRef(false);
  const baseAnswers = useRef<Record<string, boolean>>({});
  const lessonStartedAt = useRef(Date.now());
  const exerciseStartedAt = useRef(Date.now());
  const trackedLessonId = useRef<string | null>(null);
  const trackedRetries = useRef(new Set<string>());

  const completedCount = exercise ? exerciseIndex + (submitted ? 1 : 0) : 0;
  const progressRatio = getPracticeProgress(completedCount, session.length);
  const accessible = Boolean(node && (completedLessonIds.includes(node.id) || isUnlocked(node.id)));

  useEffect(() => {
    if (hydrated && node && !accessible) router.replace('/');
  }, [accessible, hydrated, node]);

  useEffect(() => {
    Animated.timing(progressAnimation, { toValue: progressRatio, duration: 240, useNativeDriver: false }).start();
  }, [progressAnimation, progressRatio]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!hydrated || !accessible || consent !== 'granted' || !node || trackedLessonId.current === node.id) return;
    trackedLessonId.current = node.id;
    lessonStartedAt.current = Date.now();
    track('lesson_started', { lesson_id: node.id });
  }, [accessible, consent, hydrated, node, track]);

  useEffect(() => {
    exerciseStartedAt.current = Date.now();
    if (!hydrated || !accessible || consent !== 'granted' || !node || !currentItem?.isReview || trackedRetries.current.has(currentItem.key)) return;
    trackedRetries.current.add(currentItem.key);
    track('exercise_retried', { lesson_id: node.id, exercise_id: currentItem.exercise.id });
  }, [accessible, consent, currentItem, hydrated, node, track]);

  if (!hydrated || !accessible || !node || !exercise || !currentItem) {
    return (
      <ScreenShell>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.centeredTitle}>课程不存在</Text>
          <Pressable onPress={() => router.replace('/')} style={styles.primaryButton}><Text style={styles.primaryButtonText}>返回路径</Text></Pressable>
        </SafeAreaView>
      </ScreenShell>
    );
  }

  const retryLesson = () => {
    const nextRetry = retryCount + 1;
    setRetryCount(nextRetry);
    setSession((current) => restartPracticeSession(current, nextRetry));
    setExerciseIndex(0);
    setSelectedIds([]);
    setOrderedIds([]);
    setSubmitted(false);
    setHearts(MAX_HEARTS);
    setFailed(false);
    setMistakeCount(0);
    baseAnswers.current = {};
    trackedRetries.current.clear();
    lessonStartedAt.current = Date.now();
    exerciseStartedAt.current = Date.now();
    track('lesson_started', { lesson_id: node.id });
    submissionLocked.current = false;
    progressAnimation.setValue(0);
  };

  if (failed) {
    return (
      <ScreenShell>
        <SafeAreaView style={styles.failedSafeArea} edges={['top', 'bottom']}>
          <View style={styles.failedContent}>
            <View style={styles.failedIcon}><AppIcon name="heart" size={48} color={colors.danger} /></View>
            <Text style={styles.failedKicker}>本轮结束</Text>
            <Text style={styles.failedTitle}>生命值用完了</Text>
            <Text style={styles.failedText}>已完成 {Math.min(exerciseIndex + 1, session.length)} / {session.length} 题，本轮出现 {mistakeCount} 次错误。</Text>
          </View>
          <View style={styles.failedActions}>
            <Pressable onPress={retryLesson} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}><Text style={styles.primaryButtonText}>重新挑战</Text></Pressable>
            <Pressable onPress={() => router.replace('/')} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>返回学习路径</Text></Pressable>
          </View>
        </SafeAreaView>
      </ScreenShell>
    );
  }

  const total = session.length;
  const isLast = exerciseIndex === total - 1;
  const isCorrect = isExerciseAnswerCorrect(exercise, selectedIds, orderedIds);
  const ready = isExerciseReady(exercise, selectedIds, orderedIds);

  const toggleChoice = (choiceId: string) => {
    if (exercise.type === 'single-choice') setSelectedIds([choiceId]);
    else setSelectedIds((current) => current.includes(choiceId) ? current.filter((idValue) => idValue !== choiceId) : [...current, choiceId]);
  };

  const submitOrContinue = () => {
    if (!submitted) {
      if (!ready || submissionLocked.current) return;
      submissionLocked.current = true;
      setSubmitted(true);
      if (!currentItem.isReview && exercise.type !== 'self-recall' && baseAnswers.current[exercise.id] === undefined) {
        baseAnswers.current[exercise.id] = isCorrect;
      }
      track('exercise_answered', {
        lesson_id: node.id,
        exercise_id: exercise.id,
        exercise_type: exercise.type,
        correct: isCorrect,
        attempt_number: currentItem.isReview ? 2 : 1,
        duration_ms: Math.min(3_600_000, Math.max(0, Date.now() - exerciseStartedAt.current)),
      });
      if (isCorrect) {
        playCorrect();
      } else {
        const nextHearts = applyHeartPenalty(hearts);
        setMistakeCount((count) => count + 1);
        setHearts(nextHearts);
        if (!reduceMotion) {
          Animated.sequence([
            Animated.timing(heartAnimation, { toValue: 0.72, duration: 90, useNativeDriver: true }),
            Animated.spring(heartAnimation, { toValue: 1, speed: 24, bounciness: 7, useNativeDriver: true }),
          ]).start();
        }
        setSession((current) => appendWrongReview(current, currentItem));
        playWrong();
        if (nextHearts === 0) setFailed(true);
      }
      return;
    }

    if (isLast) {
      const scoredAnswers = Object.entries(baseAnswers.current);
      const baseExerciseIds = session.filter((item) => !item.isReview).map((item) => item.exercise.id);
      const incorrectExerciseIds = scoredAnswers.filter(([, correct]) => !correct).map(([exerciseId]) => exerciseId);
      router.replace({ pathname: '/complete/[id]', params: {
        id: node.id,
        correctCount: String(scoredAnswers.filter(([, correct]) => correct).length),
        total: String(scoredAnswers.length),
        questionCount: String(baseExerciseIds.length),
        incorrectIds: incorrectExerciseIds.join(','),
        baseIds: baseExerciseIds.join(','),
        lessonDurationMs: String(Math.min(3_600_000, Math.max(0, Date.now() - lessonStartedAt.current))),
      } });
      return;
    }

    setExerciseIndex((index) => index + 1);
    setSelectedIds([]);
    setOrderedIds([]);
    setSubmitted(false);
    submissionLocked.current = false;
  };

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="退出课程" onPress={() => router.back()} hitSlop={12}><AppIcon name="close" size={24} color="#AAA3BA" /></Pressable>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressAnimation.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
          </View>
          <Animated.View accessible accessibilityLabel={`剩余 ${hearts} 点生命`} style={[styles.hearts, { transform: [{ scale: heartAnimation }] }]}>
            <AppIcon name="heart" size={23} color={colors.danger} />
            <Text style={styles.heartCount}>{hearts}</Text>
          </Animated.View>
        </View>

        <ScrollView contentContainerStyle={[styles.content, submitted && styles.contentWithFeedback]} showsVerticalScrollIndicator={false}>
          <ExercisePrompt exercise={exercise} eyebrow={currentItem.isReview ? `错题复练 · ${exerciseIndex + 1}/${total}` : `${exercise.eyebrow} · ${exerciseIndex + 1}/${total}`} />
          <ExerciseResponse
            exercise={exercise}
            orderedIds={orderedIds}
            selectedIds={selectedIds}
            submitted={submitted}
            onChoicePress={toggleChoice}
            onOrderChange={setOrderedIds}
          />

          {submitted && exercise.keywords.length > 0 ? (
            <View style={styles.keywordSection}>
              <View style={styles.keywordRow}>
                {exercise.keywords.map((keywordId) => keywords[keywordId] ? (
                  <Pressable key={keywordId} onPress={() => setActiveKeyword(keywords[keywordId])} style={styles.keywordChip}>
                    <Text style={styles.keywordChipText}>{keywords[keywordId].label}</Text>
                  </Pressable>
                ) : null)}
              </View>
            </View>
          ) : null}
        </ScrollView>

        {!submitted ? (
          <View style={styles.actionArea}>
            <Pressable disabled={!ready} onPress={submitOrContinue} style={({ pressed }) => [styles.primaryButton, !ready && styles.buttonDisabled, pressed && ready && styles.buttonPressed]}>
              <Text style={styles.primaryButtonText}>{exercise.type === 'self-recall' ? '查看参考要点' : '检查答案'}</Text>
            </Pressable>
          </View>
        ) : (
          <ExerciseFeedback exercise={exercise} isCorrect={isCorrect} actionLabel={isLast ? '完成关卡' : '继续'} onContinue={submitOrContinue} />
        )}
      </SafeAreaView>
      {activeKeyword ? <KeywordSheet keyword={activeKeyword} onClose={() => setActiveKeyword(null)} /> : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  centeredTitle: { color: colors.text, fontSize: 23, lineHeight: 31, fontWeight: '900' },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 14 },
  progressTrack: { flex: 1, height: 9, borderRadius: 9, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 9, backgroundColor: colors.primary },
  hearts: { minWidth: 42, height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  heartCount: { color: colors.danger, fontSize: 15, fontWeight: '900', fontVariant: ['tabular-nums'] },
  content: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 110 },
  contentWithFeedback: { paddingBottom: 290 },
  keywordSection: { marginTop: 22 },
  keywordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keywordChip: { backgroundColor: colors.primarySoft, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 },
  keywordChipText: { color: colors.primaryDark, fontWeight: '900' },
  actionArea: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, backgroundColor: colors.background },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 16, minHeight: 55, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryButtonText: { color: colors.surface, fontWeight: '900', fontSize: 15 },
  buttonDisabled: { backgroundColor: '#D9D4E5' },
  buttonPressed: { transform: [{ translateY: 2 }] },
  failedSafeArea: { flex: 1 },
  failedContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  failedIcon: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', borderRadius: 48, backgroundColor: '#FFF0F3' },
  failedKicker: { color: colors.danger, fontSize: 12, fontWeight: '900', marginTop: 22 },
  failedTitle: { color: colors.text, fontSize: 27, fontWeight: '900', marginTop: 7 },
  failedText: { color: colors.textMuted, textAlign: 'center', lineHeight: 21, marginTop: 10 },
  failedActions: { gap: 9, padding: 20 },
  secondaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.textMuted, fontWeight: '900' },
});
