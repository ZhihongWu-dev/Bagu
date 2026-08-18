import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { colors } from '@/theme/colors';
import type { Exercise } from '@/types/course';

type ExerciseFeedbackProps = {
  exercise: Exercise;
  isCorrect: boolean;
  actionLabel: string;
  onContinue: () => void;
  showAction?: boolean;
};

export function ExerciseFeedback({ exercise, isCorrect, actionLabel, onContinue, showAction = true }: ExerciseFeedbackProps) {
  const points = exercise.type === 'self-recall' ? exercise.referencePoints : exercise.coveredPoints;
  return (
    <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
      <Text style={[styles.feedbackTitle, !isCorrect && styles.feedbackTitleWrong]}>{exercise.type === 'self-recall' ? '参考要点' : isCorrect ? '回答正确' : '需要再巩固'}</Text>
      <Text numberOfLines={3} style={styles.feedbackText}>{exercise.explanation}</Text>
      <View style={styles.points}>
        {points.slice(0, 3).map((point) => <View key={point} style={styles.pointRow}><AppIcon name="check" size={14} color={colors.successDark} /><Text style={styles.point}>{point}</Text></View>)}
      </View>
      {showAction ? <Pressable onPress={onContinue} style={[styles.primaryButton, styles.continueButton]}><Text style={styles.primaryButtonText}>{actionLabel}</Text></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  feedback: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingBottom: 24, borderTopWidth: 2 },
  feedbackCorrect: { backgroundColor: colors.successSoft, borderTopColor: '#BDEBDE' },
  feedbackWrong: { backgroundColor: '#FFF0F3', borderTopColor: '#FFD0D9' },
  feedbackTitle: { color: colors.successDark, fontSize: 18, fontWeight: '900' },
  feedbackTitleWrong: { color: '#C43E58' },
  feedbackText: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 7 },
  points: { marginTop: 7, gap: 2 },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  point: { flex: 1, color: colors.text, fontSize: 11, fontWeight: '700' },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 16, minHeight: 55, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryButtonText: { color: colors.surface, fontWeight: '900', fontSize: 15 },
  continueButton: { backgroundColor: colors.success, marginTop: 13 },
});
