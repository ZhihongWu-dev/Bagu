import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KeywordSheet } from '@/components/keyword-sheet';
import { ScreenShell } from '@/components/screen-shell';
import { useSounds } from '@/context/sound-context';
import { transformerLessons, keywords } from '@/data/transformer-course';
import { colors } from '@/theme/colors';
import type { KnowledgeKeyword } from '@/types/course';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = useMemo(() => transformerLessons.find((item) => item.id === id), [id]);
  const exercise = lesson?.exercises[0];
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [activeKeyword, setActiveKeyword] = useState<KnowledgeKeyword | null>(null);
  const { playCorrect, playWrong } = useSounds();

  if (!lesson || !exercise) {
    return (
      <ScreenShell>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.title}>找不到这个知识点</Text>
          <Pressable onPress={() => router.replace('/')} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>返回学习路径</Text>
          </Pressable>
        </SafeAreaView>
      </ScreenShell>
    );
  }

  const isCorrect = selectedChoiceId === exercise.correctChoiceId;
  const correctChoiceIndex = exercise.choices.findIndex((choice) => choice.id === exercise.correctChoiceId);
  const correctChoiceLabel = String.fromCharCode(65 + correctChoiceIndex);

  const submitOrContinue = () => {
    if (!submitted) {
      if (selectedChoiceId) {
        setSubmitted(true);
        if (selectedChoiceId === exercise.correctChoiceId) playCorrect();
        else playWrong();
      }
      return;
    }
    router.replace({ pathname: '/complete/[id]', params: { id: lesson.id, correct: String(isCorrect) } });
  };

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="退出课程" onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.close}>×</Text>
          </Pressable>
          <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
          <Text style={styles.focus}>♥ 5</Text>
        </View>

        <ScrollView contentContainerStyle={[styles.content, submitted && styles.contentWithFeedback]} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>{exercise.eyebrow}</Text>
          <Text style={styles.title}>{exercise.prompt}</Text>
          {exercise.formula && <Text style={styles.formula}>{exercise.formula}</Text>}

          <View style={styles.choices}>
            {exercise.choices.map((choice, index) => {
              const selected = selectedChoiceId === choice.id;
              const correctChoice = submitted && choice.id === exercise.correctChoiceId;
              const wrongChoice = submitted && selected && !isCorrect;
              return (
                <Pressable
                  key={choice.id}
                  disabled={submitted}
                  onPress={() => setSelectedChoiceId(choice.id)}
                  style={({ pressed }) => [
                    styles.choice,
                    selected && styles.choiceSelected,
                    correctChoice && styles.choiceCorrect,
                    wrongChoice && styles.choiceWrong,
                    pressed && styles.choicePressed,
                  ]}>
                  <View style={[styles.choiceKey, selected && styles.choiceKeySelected]}>
                    <Text style={[styles.choiceKeyText, selected && styles.choiceTextSelected]}>{String.fromCharCode(65 + index)}</Text>
                  </View>
                  <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{choice.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {submitted && (
            <View style={styles.keywordSection}>
              <Text style={styles.keywordTitle}>点击关键词深入理解</Text>
              <View style={styles.keywordRow}>
                {exercise.keywords.map((keywordId) => (
                  <Pressable key={keywordId} onPress={() => setActiveKeyword(keywords[keywordId])} style={styles.keywordChip}>
                    <Text style={styles.keywordChipText}>{keywords[keywordId].label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {!submitted ? (
          <View style={styles.actionArea}>
            <Pressable
              disabled={!selectedChoiceId}
              onPress={submitOrContinue}
              style={({ pressed }) => [styles.primaryButton, !selectedChoiceId && styles.buttonDisabled, pressed && selectedChoiceId && styles.buttonPressed]}>
              <Text style={styles.primaryButtonText}>检查答案</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <Text style={[styles.feedbackTitle, !isCorrect && styles.feedbackTitleWrong]}>
              {isCorrect ? '回答正确！  +10 XP' : `再想一步，答案是 ${correctChoiceLabel}`}
            </Text>
            <Text style={styles.feedbackText}>{exercise.explanation}</Text>
            <View style={styles.points}>
              {exercise.coveredPoints.map((point) => <Text key={point} style={styles.point}>✓ {point}</Text>)}
              {exercise.missingPoint && <Text style={styles.missingPoint}>＋ {exercise.missingPoint}</Text>}
            </View>
            <Pressable onPress={submitOrContinue} style={[styles.primaryButton, styles.continueButton]}>
              <Text style={styles.primaryButtonText}>继续</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
      <KeywordSheet keyword={activeKeyword} onClose={() => setActiveKeyword(null)} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { height: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 14 },
  close: { color: '#AAA3BA', fontSize: 28, fontWeight: '500' },
  progressTrack: { flex: 1, height: 8, borderRadius: 8, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  progressFill: { width: '44%', height: '100%', borderRadius: 8, backgroundColor: colors.primary },
  focus: { color: colors.danger, fontWeight: '900' },
  content: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 110 },
  contentWithFeedback: { paddingBottom: 310 },
  eyebrow: { color: colors.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: colors.text, fontSize: 23, lineHeight: 31, fontWeight: '900', marginTop: 12 },
  formula: { color: colors.text, backgroundColor: colors.primarySoft, borderWidth: 2, borderColor: '#DBD2FF', borderRadius: 17, paddingVertical: 18, paddingHorizontal: 10, textAlign: 'center', fontSize: 19, marginTop: 18 },
  choices: { gap: 12, marginTop: 22 },
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
  keywordSection: { marginTop: 28 },
  keywordTitle: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  keywordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  keywordChip: { backgroundColor: colors.primarySoft, borderBottomWidth: 2, borderBottomColor: colors.primary, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 },
  keywordChipText: { color: colors.primaryDark, fontWeight: '900' },
  actionArea: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, backgroundColor: colors.background },
  primaryButton: { backgroundColor: colors.primary, borderBottomWidth: 5, borderBottomColor: colors.primaryDark, borderRadius: 16, minHeight: 55, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryButtonText: { color: colors.surface, fontWeight: '900', fontSize: 15 },
  buttonDisabled: { backgroundColor: '#D9D4E5', borderBottomColor: '#C2BBCF' },
  buttonPressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
  feedback: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingBottom: 24, borderTopWidth: 2 },
  feedbackCorrect: { backgroundColor: colors.successSoft, borderTopColor: '#BDEBDE' },
  feedbackWrong: { backgroundColor: '#FFF0F3', borderTopColor: '#FFD0D9' },
  feedbackTitle: { color: colors.successDark, fontSize: 18, fontWeight: '900' },
  feedbackTitleWrong: { color: '#C43E58' },
  feedbackText: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: 8 },
  points: { marginTop: 8, gap: 3 },
  point: { color: colors.successDark, fontSize: 12, fontWeight: '800' },
  missingPoint: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  continueButton: { backgroundColor: colors.success, borderBottomColor: colors.successDark, marginTop: 14 },
});
