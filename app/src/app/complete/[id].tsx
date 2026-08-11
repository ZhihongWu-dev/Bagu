import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { transformerNodes } from '@/data/transformer-course';
import { useCompletionSound } from '@/hooks/use-feedback-sounds';
import { colors } from '@/theme/colors';

export default function CompleteScreen() {
  const { id, correct, correctCount, total } = useLocalSearchParams<{ id: string; correct?: string; correctCount?: string; total?: string }>();
  const { completeLesson } = useProgress();
  const playComplete = useCompletionSound();
  const playedSound = useRef(false);
  const recordedCompletion = useRef(false);
  const node = useMemo(() => transformerNodes.find((item) => item.id === id), [id]);
  const questionTotal = Math.max(1, Number(total) || 1);
  const answeredCorrectly = correctCount === undefined ? (correct === 'true' ? 1 : 0) : Math.min(questionTotal, Number(correctCount) || 0);
  const scorePercent = Math.round((answeredCorrectly / questionTotal) * 100);
  const earnedXp = Math.max(5, answeredCorrectly * 5);

  useEffect(() => {
    if (!node || recordedCompletion.current) return;
    recordedCompletion.current = true;
    completeLesson(node.id, earnedXp);
  }, [completeLesson, earnedXp, node]);

  useEffect(() => {
    if (!node || playedSound.current) return;
    playedSound.current = true;
    playComplete();
  }, [node, playComplete]);

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.burst}><Text style={styles.burstText}>✓</Text></View>
          <Text style={styles.kicker}>课程完成</Text>
          <Text style={styles.title}>{node?.shortTitle ?? 'Transformer 基础'}</Text>
          <Text style={styles.subtitle}>本关 {questionTotal} 题已完成，下一节点已经解锁。</Text>
          <View style={styles.statsCard}>
            <View style={styles.stat}><Text style={styles.statValue}>+{earnedXp}</Text><Text style={styles.statLabel}>经验值</Text></View>
            <View style={styles.divider} />
            <View style={styles.stat}><Text style={styles.statValue}>{scorePercent}%</Text><Text style={styles.statLabel}>本关正确率</Text></View>
          </View>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewIcon}>◷</Text>
            <View style={styles.reviewCopy}>
              <Text style={styles.reviewTitle}>已安排间隔复习</Text>
              <Text style={styles.reviewText}>这个知识点会在明天重新出现。</Text>
            </View>
          </View>
        </View>
        <View style={styles.actionArea}>
          <Pressable onPress={() => router.replace('/')} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <Text style={styles.buttonText}>返回学习路径</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  burst: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.success, borderBottomWidth: 9, borderBottomColor: colors.successDark, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { boxShadow: '0 10px 24px rgba(37, 185, 149, 0.25)' }, default: { shadowColor: colors.success, shadowOpacity: 0.25, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 8 } }) },
  burstText: { color: colors.surface, fontSize: 48, fontWeight: '900' },
  kicker: { color: colors.successDark, fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: 24 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 7 },
  subtitle: { color: colors.textMuted, textAlign: 'center', lineHeight: 21, marginTop: 9, maxWidth: 300 },
  statsCard: { alignSelf: 'stretch', flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 20, paddingVertical: 18, marginTop: 28 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.primary, fontSize: 21, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', marginTop: 5 },
  divider: { width: 1, backgroundColor: colors.border },
  reviewCard: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: colors.currentSoft, borderRadius: 17, padding: 15, marginTop: 14 },
  reviewIcon: { color: colors.currentDark, fontSize: 24, fontWeight: '900' },
  reviewCopy: { flex: 1 },
  reviewTitle: { color: colors.text, fontWeight: '900' },
  reviewText: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  actionArea: { padding: 20 },
  button: { backgroundColor: colors.primary, borderBottomWidth: 5, borderBottomColor: colors.primaryDark, borderRadius: 16, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  buttonPressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
  buttonText: { color: colors.surface, fontWeight: '900' },
});
