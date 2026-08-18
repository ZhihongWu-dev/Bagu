import { StyleSheet, Text, View } from 'react-native';

import { MathFormula } from '@/components/math-formula';
import { colors } from '@/theme/colors';
import type { Exercise } from '@/types/course';

type ExercisePromptProps = {
  exercise: Exercise;
  eyebrow?: string;
};

export function ExercisePrompt({ exercise, eyebrow = exercise.eyebrow }: ExercisePromptProps) {
  return (
    <>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{exercise.prompt}</Text>
      {exercise.formula ? (
        <View style={styles.formulaCard}>
          <MathFormula expression={exercise.formula} />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  title: { color: colors.text, fontSize: 23, lineHeight: 31, fontWeight: '900', marginTop: 10 },
  formulaCard: { overflow: 'hidden', backgroundColor: colors.primarySoft, borderRadius: 17, paddingHorizontal: 8, marginTop: 18 },
});
