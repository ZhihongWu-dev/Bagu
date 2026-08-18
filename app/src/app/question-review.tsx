import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { ExerciseFeedback } from '@/components/exercise-feedback';
import { ExercisePrompt } from '@/components/exercise-prompt';
import { ExerciseResponse } from '@/components/exercise-response';
import { ScreenShell } from '@/components/screen-shell';
import { attentionSection } from '@/data/transformer/attention-section';
import { createQuestionAnnotationState, getAnnotationProgress, upsertQuestionAnnotation } from '@/question-review/annotation-data';
import { questionReviewEnabled } from '@/question-review/config';
import { exportAnnotationsAsCsv, exportAnnotationsAsJson } from '@/question-review/export';
import { shareAnnotationExport } from '@/question-review/share';
import type { AnswerBasis, CueType, QuestionAnnotationInput, QuestionAnnotationState, Rating } from '@/question-review/types';
import { loadQuestionAnnotations, saveQuestionAnnotations } from '@/storage/question-annotation-storage';
import { colors } from '@/theme/colors';
import { isExerciseAnswerCorrect, isExerciseReady } from '@/utils/exercise';

const SCOPE_ID = 'transformer-attention-v2';
const questions = attentionSection.nodes.flatMap((node) => node.exercises).filter((exercise) => exercise.questionVersion === 2);
const answerBasisOptions: { value: AnswerBasis; label: string }[] = [
  { value: 'reasoning', label: '推理得出' }, { value: 'memory', label: '记忆作答' },
  { value: 'answer-cue', label: '答案有提示' }, { value: 'elimination', label: '排除后猜' }, { value: 'random', label: '随机猜测' },
];
const cueOptions: { value: CueType; label: string }[] = [
  { value: 'none', label: '没有提示' }, { value: 'answer-repetition', label: '题干重复答案' },
  { value: 'length', label: '长度暴露' }, { value: 'wording', label: '措辞暴露' },
  { value: 'formatting', label: '格式暴露' }, { value: 'other', label: '其他' },
];

export default function QuestionReviewScreen() {
  const [state, setState] = useState<QuestionAnnotationState | null>(null);
  const [index, setIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [answerBasis, setAnswerBasis] = useState<AnswerBasis | null>(null);
  const [clarity, setClarity] = useState<Rating | null>(null);
  const [multipleAnswerSuspicion, setMultipleAnswerSuspicion] = useState<boolean | null>(null);
  const [distractorPlausibility, setDistractorPlausibility] = useState<Rating | null>(null);
  const [cueType, setCueType] = useState<CueType | null>(null);
  const [explanationHelpfulness, setExplanationHelpfulness] = useState<Rating | null>(null);
  const [perceivedDifficulty, setPerceivedDifficulty] = useState<Rating | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const exercise = questions[index];
  const progress = useMemo(() => state ? getAnnotationProgress(state) : null, [state]);

  useEffect(() => {
    if (!questionReviewEnabled) {
      router.replace('/');
      return;
    }
    void loadQuestionAnnotations().then((saved) => {
      const ids = questions.map((question) => question.id);
      const compatible = saved?.scopeId === SCOPE_ID && saved.questionIds.join('|') === ids.join('|');
      const next = compatible ? saved : createQuestionAnnotationState(SCOPE_ID, ids);
      setState(next);
      const resumeId = getAnnotationProgress(next).resumeQuestionId;
      setIndex(Math.max(0, resumeId ? ids.indexOf(resumeId) : ids.length - 1));
    });
  }, []);

  if (!questionReviewEnabled) return null;
  if (!state || !exercise || !progress) {
    return <ScreenShell><SafeAreaView style={styles.center}><Text style={styles.emptyTitle}>{questions.length ? '正在读取标注进度…' : 'Section 1 候选题尚未生成'}</Text></SafeAreaView></ScreenShell>;
  }

  const isCorrect = isExerciseAnswerCorrect(exercise, selectedIds, orderedIds);
  const ready = isExerciseReady(exercise, selectedIds, orderedIds);
  const formReady = Boolean(answerBasis && clarity && distractorPlausibility && cueType && explanationHelpfulness && perceivedDifficulty && multipleAnswerSuspicion !== null);
  const batchNumber = Math.floor(index / state.batchSize) + 1;
  const batchPosition = (index % state.batchSize) + 1;

  const resetForm = () => {
    setSelectedIds([]); setOrderedIds([]); setAnswered(false); setAnswerBasis(null); setClarity(null);
    setMultipleAnswerSuspicion(null); setDistractorPlausibility(null); setCueType(null);
    setExplanationHelpfulness(null); setPerceivedDifficulty(null); setNote(''); setError(null);
  };

  const toggleChoice = (choiceId: string) => {
    if (exercise.type === 'single-choice') setSelectedIds([choiceId]);
    else setSelectedIds((current) => current.includes(choiceId) ? current.filter((id) => id !== choiceId) : [...current, choiceId]);
  };

  const saveAndContinue = async () => {
    if (!answerBasis || !clarity || multipleAnswerSuspicion === null || !distractorPlausibility || !cueType || !explanationHelpfulness || !perceivedDifficulty) { setError('请完成全部必填标注'); return; }
    const input: QuestionAnnotationInput = {
      answerBasis, clarity, multipleAnswerSuspicion, distractorPlausibility, cueType,
      explanationHelpfulness, perceivedDifficulty, ...(note.trim() ? { note: note.trim() } : {}),
    };
    const next = upsertQuestionAnnotation(state, exercise.id, exercise.questionVersion ?? 1, input);
    await saveQuestionAnnotations(next);
    setState(next);
    const nextIndex = next.questionIds.findIndex((id, questionIndex) => questionIndex > index && !next.records[id]);
    if (nextIndex >= 0) { setIndex(nextIndex); resetForm(); }
  };

  const exportFile = async (format: 'json' | 'csv') => {
    try {
      await shareAnnotationExport(format === 'json' ? exportAnnotationsAsJson(state) : exportAnnotationsAsCsv(state), format);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '导出失败');
    }
  };

  if (progress.remaining === 0) {
    return (
      <ScreenShell>
        <SafeAreaView style={styles.completed} edges={['top', 'bottom']}>
          <View style={styles.completedIcon}><AppIcon name="check" size={38} color={colors.surface} /></View>
          <Text style={styles.completedTitle}>Section 1 标注完成</Text>
          <Text style={styles.completedMeta}>已保存 {progress.completed} 道题，数据仅保存在本机。</Text>
          <View style={styles.completedActions}>
            <Pressable onPress={() => void exportFile('json')} style={styles.primaryButton}><Text style={styles.primaryText}>导出 JSON</Text></Pressable>
            <Pressable onPress={() => void exportFile('csv')} style={styles.secondaryButton}><Text style={styles.secondaryText}>导出 CSV</Text></Pressable>
            <Pressable onPress={() => router.back()} style={styles.secondaryButton}><Text style={styles.secondaryText}>返回</Text></Pressable>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </SafeAreaView>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="退出标注" onPress={() => router.back()} hitSlop={12}><AppIcon name="close" size={24} color={colors.textMuted} /></Pressable>
          <View style={styles.headerCopy}><Text style={styles.headerTitle}>题库人工标注</Text><Text style={styles.headerMeta}>第 {batchNumber}/{progress.batchCount} 批 · {batchPosition}/{state.batchSize}</Text></View>
          <Text style={styles.counter}>{progress.completed}/{progress.total}</Text>
        </View>
        <View style={styles.track}><View style={[styles.fill, { width: `${Math.round(progress.completionRate * 100)}%` }]} /></View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ExercisePrompt exercise={exercise} eyebrow={`${exercise.cognitiveLevel ?? '未分级'} · ${exercise.id}`} />
          <ExerciseResponse exercise={exercise} orderedIds={orderedIds} selectedIds={selectedIds} submitted={answered} onChoicePress={toggleChoice} onOrderChange={setOrderedIds} />
          {!answered ? (
            <Pressable disabled={!ready} onPress={() => setAnswered(true)} style={[styles.primaryButton, !ready && styles.disabled]}><Text style={styles.primaryText}>{exercise.type === 'self-recall' ? '查看参考要点' : '检查答案'}</Text></Pressable>
          ) : (
            <>
              <View style={styles.feedbackFrame}><ExerciseFeedback exercise={exercise} isCorrect={isCorrect} actionLabel="" onContinue={() => undefined} showAction={false} /></View>
              <View style={styles.annotationSection}>
                <Text style={styles.sectionTitle}>你主要依据什么作答？</Text>
                <OptionGrid options={answerBasisOptions} value={answerBasis} onChange={setAnswerBasis} />
                <RatingRow label="题干清晰度" value={clarity} onChange={setClarity} />
                <RatingRow label="干扰项可信度" value={distractorPlausibility} onChange={setDistractorPlausibility} />
                <RatingRow label="解释帮助程度" value={explanationHelpfulness} onChange={setExplanationHelpfulness} />
                <RatingRow label="感知难度" value={perceivedDifficulty} onChange={setPerceivedDifficulty} low="很易" high="很难" />
                <Text style={styles.sectionTitle}>是否怀疑存在多个正确答案？</Text>
                <View style={styles.binaryRow}>
                  <Pressable onPress={() => setMultipleAnswerSuspicion(false)} style={[styles.binaryOption, multipleAnswerSuspicion === false && styles.optionSelected]}><Text style={[styles.optionText, multipleAnswerSuspicion === false && styles.optionTextSelected]}>没有</Text></Pressable>
                  <Pressable onPress={() => setMultipleAnswerSuspicion(true)} style={[styles.binaryOption, multipleAnswerSuspicion === true && styles.dangerOption]}><Text style={[styles.optionText, multipleAnswerSuspicion === true && styles.dangerText]}>怀疑有</Text></Pressable>
                </View>
                <Text style={styles.sectionTitle}>是否存在答案提示？</Text>
                <OptionGrid options={cueOptions} value={cueType} onChange={setCueType} />
                <TextInput multiline maxLength={1000} placeholder="补充说明（可选）" placeholderTextColor={colors.textMuted} value={note} onChangeText={setNote} style={styles.note} />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Pressable disabled={!formReady} onPress={() => void saveAndContinue()} style={[styles.primaryButton, !formReady && styles.disabled]}><Text style={styles.primaryText}>{index === questions.length - 1 ? '保存标注' : '保存并继续'}</Text></Pressable>
              </View>
            </>
          )}
          {progress.completed > 0 ? <View style={styles.exportRow}><Pressable onPress={() => void exportFile('json')} style={styles.secondaryButton}><Text style={styles.secondaryText}>导出 JSON</Text></Pressable><Pressable onPress={() => void exportFile('csv')} style={styles.secondaryButton}><Text style={styles.secondaryText}>导出 CSV</Text></Pressable></View> : null}
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}

function OptionGrid<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T | null; onChange: (value: T) => void }) {
  return <View style={styles.optionGrid}>{options.map((option) => <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.option, value === option.value && styles.optionSelected]}><Text style={[styles.optionText, value === option.value && styles.optionTextSelected]}>{option.label}</Text></Pressable>)}</View>;
}

function RatingRow({ label, value, onChange, low = '较差', high = '很好' }: { label: string; value: Rating | null; onChange: (value: Rating) => void; low?: string; high?: string }) {
  return <View style={styles.ratingBlock}><Text style={styles.ratingLabel}>{label}</Text><View style={styles.ratingRow}><Text style={styles.ratingEdge}>{low}</Text>{([1, 2, 3, 4, 5] as Rating[]).map((rating) => <Pressable key={rating} accessibilityLabel={`${label} ${rating} 分`} onPress={() => onChange(rating)} style={[styles.ratingButton, value === rating && styles.ratingSelected]}><Text style={[styles.ratingText, value === rating && styles.ratingTextSelected]}>{rating}</Text></Pressable>)}<Text style={styles.ratingEdge}>{high}</Text></View></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }, emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  completed: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }, completedIcon: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center', borderRadius: 38, backgroundColor: colors.success }, completedTitle: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 20 }, completedMeta: { color: colors.textMuted, fontSize: 12, marginTop: 8 }, completedActions: { alignSelf: 'stretch', gap: 10, marginTop: 24 },
  header: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 20 }, headerCopy: { flex: 1 }, headerTitle: { color: colors.text, fontSize: 17, fontWeight: '900' }, headerMeta: { color: colors.textMuted, fontSize: 10, marginTop: 3 }, counter: { color: colors.primary, fontSize: 12, fontWeight: '900', fontVariant: ['tabular-nums'] },
  track: { height: 7, marginHorizontal: 20, overflow: 'hidden', borderRadius: 7, backgroundColor: colors.surfaceMuted }, fill: { height: '100%', borderRadius: 7, backgroundColor: colors.primary },
  content: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 48 }, primaryButton: { minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.primary, marginTop: 22 }, primaryText: { color: colors.surface, fontSize: 15, fontWeight: '900' }, disabled: { backgroundColor: '#D9D4E5' },
  feedbackFrame: { height: 180, marginTop: 20, position: 'relative', overflow: 'hidden', borderRadius: 8 }, annotationSection: { gap: 12, marginTop: 28 }, sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 8 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, option: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface }, optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft }, optionText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' }, optionTextSelected: { color: colors.primaryDark },
  ratingBlock: { gap: 7 }, ratingLabel: { color: colors.text, fontSize: 12, fontWeight: '800' }, ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 }, ratingEdge: { width: 28, color: colors.textMuted, fontSize: 9, textAlign: 'center' }, ratingButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 19, backgroundColor: colors.surface }, ratingSelected: { borderColor: colors.primary, backgroundColor: colors.primary }, ratingText: { color: colors.textMuted, fontWeight: '900' }, ratingTextSelected: { color: colors.surface },
  binaryRow: { flexDirection: 'row', gap: 8 }, binaryOption: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface }, dangerOption: { borderColor: colors.danger, backgroundColor: '#FFF0F3' }, dangerText: { color: colors.danger },
  note: { minHeight: 92, padding: 12, borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, color: colors.text, backgroundColor: colors.surface, textAlignVertical: 'top' }, error: { color: colors.danger, fontSize: 11, fontWeight: '800' },
  exportRow: { flexDirection: 'row', gap: 10, marginTop: 18 }, secondaryButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface }, secondaryText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
});
