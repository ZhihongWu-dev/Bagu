import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { MathFormula } from '@/components/math-formula';
import { colors } from '@/theme/colors';
import type { Choice, Exercise } from '@/types/course';

type ExerciseResponseProps = {
  exercise: Exercise;
  orderedIds: string[];
  selectedIds: string[];
  submitted: boolean;
  onChoicePress: (choiceId: string) => void;
  onOrderChange: (choiceIds: string[]) => void;
};

export function ExerciseResponse({ exercise, orderedIds, selectedIds, submitted, onChoicePress, onOrderChange }: ExerciseResponseProps) {
  if (exercise.type === 'single-choice' || exercise.type === 'multiple-choice') {
    return (
      <View style={styles.choices}>
        {exercise.choices.map((choice, index) => (
          <ChoiceButton
            key={choice.id}
            choice={choice}
            index={index}
            selected={selectedIds.includes(choice.id)}
            submitted={submitted}
            correct={exercise.type === 'single-choice' ? choice.id === exercise.correctChoiceId : exercise.correctChoiceIds.includes(choice.id)}
            onPress={() => onChoicePress(choice.id)}
          />
        ))}
      </View>
    );
  }

  if (exercise.type === 'ordering') {
    return (
      <View style={styles.orderSection}>
        <View style={styles.orderSlots}>
          {orderedIds.length ? orderedIds.map((choiceId, index) => {
            const choice = exercise.choices.find((item) => item.id === choiceId);
            if (!choice) return null;
            return (
              <Pressable key={choiceId} disabled={submitted} onPress={() => onOrderChange(orderedIds.filter((id) => id !== choiceId))} style={styles.orderSlot}>
                <Text style={styles.orderNumber}>{index + 1}</Text><Text style={styles.orderText}>{choice.label}</Text>
              </Pressable>
            );
          }) : <Text style={styles.orderHint}>依次点击下方步骤</Text>}
        </View>
        <View style={styles.orderPool}>
          {exercise.choices.filter((choice) => !orderedIds.includes(choice.id)).map((choice) => (
            <Pressable key={choice.id} disabled={submitted} onPress={() => onOrderChange([...orderedIds, choice.id])} style={styles.orderChoice}>
              <Text style={styles.orderChoiceText}>{choice.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.recallCard}>
      <AppIcon name="focus" size={35} color={colors.primary} />
      <Text style={styles.recallTitle}>先完整说一遍</Text>
      <Text style={styles.recallText}>按“结论 → 原因 → 机制 → 结果”组织，准备好后查看参考要点。</Text>
    </View>
  );
}

function ChoiceButton({ choice, index, selected, submitted, correct, onPress }: { choice: Choice; index: number; selected: boolean; submitted: boolean; correct: boolean; onPress: () => void }) {
  const wrong = submitted && selected && !correct;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled: submitted }} disabled={submitted} onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, submitted && correct && styles.choiceCorrect, wrong && styles.choiceWrong, pressed && styles.choicePressed]}>
      <View style={[styles.choiceKey, selected && styles.choiceKeySelected]}><Text style={[styles.choiceKeyText, selected && styles.choiceTextSelected]}>{String.fromCharCode(65 + index)}</Text></View>
      {choice.formula ? <MathFormula color={selected ? colors.primaryDark : colors.text} compact expression={choice.formula} fontSize={15} style={styles.choiceFormula} /> : <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{choice.label}</Text>}
      {selected ? <AppIcon name="check" size={18} color={colors.primary} strokeWidth={2.8} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  choiceFormula: { flex: 1 },
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
});
