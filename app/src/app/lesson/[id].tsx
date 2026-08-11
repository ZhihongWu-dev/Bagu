import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { KeywordSheet } from '@/components/keyword-sheet';
import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { keywords, transformerNodes } from '@/data/transformer-course';
import { useAnswerSounds } from '@/hooks/use-feedback-sounds';
import { colors } from '@/theme/colors';
import type { Choice, KnowledgeKeyword } from '@/types/course';
import { isExerciseAnswerCorrect, isExerciseReady } from '@/utils/exercise';
import { appendWrongReview, buildPracticeSession, getPracticeProgress } from '@/utils/practice-session';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const node = useMemo(() => transformerNodes.find((item) => item.id === id), [id]);
  const { nodeAttemptCounts } = useProgress();
  const [session, setSession] = useState(() => node ? buildPracticeSession(node, nodeAttemptCounts[node.id] ?? 0) : []);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [activeKeyword, setActiveKeyword] = useState<KnowledgeKeyword | null>(null);
  const { playCorrect, playWrong } = useAnswerSounds();
  const currentItem = session[exerciseIndex];
  const exercise = currentItem?.exercise;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  const completedCount = exercise ? exerciseIndex + (submitted ? 1 : 0) : 0;
  const progressRatio = getPracticeProgress(completedCount, session.length);

  useEffect(() => {
    Animated.timing(progressAnimation, { toValue: progressRatio, duration: 240, useNativeDriver: false }).start();
  }, [progressAnimation, progressRatio]);

  if (!node || !exercise || !currentItem) {
    return (
      <ScreenShell>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.title}>课程不存在</Text>
          <Pressable onPress={() => router.replace('/')} style={styles.primaryButton}><Text style={styles.primaryButtonText}>返回路径</Text></Pressable>
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
      if (!ready) return;
      setSubmitted(true);
      if (isCorrect) {
        setCorrectCount((count) => count + 1);
        playCorrect();
      } else {
        setSession((current) => appendWrongReview(current, currentItem));
        playWrong();
      }
      return;
    }

    if (isLast) {
      router.replace({ pathname: '/complete/[id]', params: { id: node.id, correctCount: String(correctCount), total: String(total) } });
      return;
    }

    setExerciseIndex((index) => index + 1);
    setSelectedIds([]);
    setOrderedIds([]);
    setSubmitted(false);
  };

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="退出课程" onPress={() => router.back()} hitSlop={12}><AppIcon name="close" size={24} color="#AAA3BA" /></Pressable>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressAnimation.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
          </View>
          <Text style={styles.counter}>{exerciseIndex + 1}/{total}</Text>
        </View>

        <ScrollView contentContainerStyle={[styles.content, submitted && styles.contentWithFeedback]} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>{currentItem.isReview ? '错题复练 · 再答一次' : exercise.eyebrow}</Text>
          <Text style={styles.title}>{exercise.prompt}</Text>
          {exercise.formula ? <Text style={styles.formula}>{exercise.formula}</Text> : null}

          {exercise.type === 'single-choice' || exercise.type === 'multiple-choice' ? (
            <View style={styles.choices}>
              {exercise.choices.map((choice, index) => (
                <ChoiceButton
                  key={choice.id}
                  choice={choice}
                  index={index}
                  selected={selectedIds.includes(choice.id)}
                  submitted={submitted}
                  correct={exercise.type === 'single-choice' ? choice.id === exercise.correctChoiceId : exercise.correctChoiceIds.includes(choice.id)}
                  onPress={() => toggleChoice(choice.id)}
                />
              ))}
            </View>
          ) : null}

          {exercise.type === 'ordering' ? (
            <View style={styles.orderSection}>
              <View style={styles.orderSlots}>
                {orderedIds.length ? orderedIds.map((choiceId, index) => {
                  const choice = exercise.choices.find((item) => item.id === choiceId)!;
                  return (
                    <Pressable key={choiceId} disabled={submitted} onPress={() => setOrderedIds((current) => current.filter((idValue) => idValue !== choiceId))} style={styles.orderSlot}>
                      <Text style={styles.orderNumber}>{index + 1}</Text><Text style={styles.orderText}>{choice.label}</Text>
                    </Pressable>
                  );
                }) : <Text style={styles.orderHint}>依次点击下方步骤</Text>}
              </View>
              <View style={styles.orderPool}>
                {exercise.choices.filter((choice) => !orderedIds.includes(choice.id)).map((choice) => (
                  <Pressable key={choice.id} disabled={submitted} onPress={() => setOrderedIds((current) => [...current, choice.id])} style={styles.orderChoice}>
                    <Text style={styles.orderChoiceText}>{choice.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {exercise.type === 'self-recall' ? (
            <View style={styles.recallCard}>
              <AppIcon name="focus" size={35} color={colors.primary} />
              <Text style={styles.recallTitle}>先完整说一遍</Text>
              <Text style={styles.recallText}>按“结论 → 原因 → 机制 → 结果”组织，准备好后查看参考要点。</Text>
            </View>
          ) : null}

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
          <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <Text style={[styles.feedbackTitle, !isCorrect && styles.feedbackTitleWrong]}>{exercise.type === 'self-recall' ? '参考要点' : isCorrect ? '回答正确' : '需要再巩固'}</Text>
            <Text numberOfLines={3} style={styles.feedbackText}>{exercise.explanation}</Text>
            <View style={styles.points}>
              {(exercise.type === 'self-recall' ? exercise.referencePoints : exercise.coveredPoints).slice(0, 3).map((point) => <View key={point} style={styles.pointRow}><AppIcon name="check" size={14} color={colors.successDark} /><Text style={styles.point}>{point}</Text></View>)}
            </View>
            <Pressable onPress={submitOrContinue} style={[styles.primaryButton, styles.continueButton]}><Text style={styles.primaryButtonText}>{isLast ? '完成关卡' : '继续'}</Text></Pressable>
          </View>
        )}
      </SafeAreaView>
      {activeKeyword ? <KeywordSheet keyword={activeKeyword} onClose={() => setActiveKeyword(null)} /> : null}
    </ScreenShell>
  );
}

function ChoiceButton({ choice, index, selected, submitted, correct, onPress }: { choice: Choice; index: number; selected: boolean; submitted: boolean; correct: boolean; onPress: () => void }) {
  const wrong = submitted && selected && !correct;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled: submitted }} disabled={submitted} onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, submitted && correct && styles.choiceCorrect, wrong && styles.choiceWrong, pressed && styles.choicePressed]}>
      <View style={[styles.choiceKey, selected && styles.choiceKeySelected]}><Text style={[styles.choiceKeyText, selected && styles.choiceTextSelected]}>{String.fromCharCode(65 + index)}</Text></View>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{choice.label}</Text>
      {selected ? <AppIcon name="check" size={18} color={colors.primary} strokeWidth={2.8} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 14 },
  progressTrack: { flex: 1, height: 9, borderRadius: 9, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 9, backgroundColor: colors.primary },
  counter: { minWidth: 28, color: colors.primary, fontSize: 12, fontWeight: '900' },
  content: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 110 },
  contentWithFeedback: { paddingBottom: 290 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  title: { color: colors.text, fontSize: 23, lineHeight: 31, fontWeight: '900', marginTop: 10 },
  formula: { color: colors.text, backgroundColor: colors.primarySoft, borderRadius: 17, paddingVertical: 18, paddingHorizontal: 10, textAlign: 'center', fontSize: 18, marginTop: 18 },
  choices: { gap: 11, marginTop: 22 },
  choice: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderRadius: 16, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  choiceCorrect: { borderColor: colors.success, backgroundColor: colors.successSoft },
  choiceWrong: { borderColor: colors.danger, backgroundColor: '#FFF0F3' },
  choicePressed: { transform: [{ scale: 0.99 }] },
  choiceKey: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 2, borderColor: colors.border },
  choiceKeySelected: { borderColor: colors.primary },
  choiceKeyText: { color: colors.textMuted, fontWeight: '900' },
  choiceText: { flex: 1, color: colors.text, fontWeight: '800', lineHeight: 20 },
  choiceTextSelected: { color: colors.primaryDark },
  orderSection: { gap: 15, marginTop: 22 },
  orderSlots: { minHeight: 128, gap: 8, padding: 12, backgroundColor: colors.surfaceMuted, borderRadius: 18 },
  orderHint: { color: colors.textMuted, textAlign: 'center', marginTop: 43 },
  orderSlot: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 11, backgroundColor: colors.surface, borderRadius: 12 },
  orderNumber: { width: 22, color: colors.primary, fontWeight: '900' },
  orderText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '800' },
  orderPool: { gap: 8 },
  orderChoice: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 13, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 14 },
  orderChoiceText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  recallCard: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 22, padding: 24, marginTop: 24 },
  recallTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 12 },
  recallText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  keywordSection: { marginTop: 22 },
  keywordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keywordChip: { backgroundColor: colors.primarySoft, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 },
  keywordChipText: { color: colors.primaryDark, fontWeight: '900' },
  actionArea: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, backgroundColor: colors.background },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 16, minHeight: 55, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryButtonText: { color: colors.surface, fontWeight: '900', fontSize: 15 },
  buttonDisabled: { backgroundColor: '#D9D4E5' },
  buttonPressed: { transform: [{ translateY: 2 }] },
  feedback: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingBottom: 24, borderTopWidth: 2 },
  feedbackCorrect: { backgroundColor: colors.successSoft, borderTopColor: '#BDEBDE' },
  feedbackWrong: { backgroundColor: '#FFF0F3', borderTopColor: '#FFD0D9' },
  feedbackTitle: { color: colors.successDark, fontSize: 18, fontWeight: '900' },
  feedbackTitleWrong: { color: '#C43E58' },
  feedbackText: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 7 },
  points: { marginTop: 7, gap: 2 },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  point: { flex: 1, color: colors.text, fontSize: 11, fontWeight: '700' },
  continueButton: { backgroundColor: colors.success, marginTop: 13 },
});
