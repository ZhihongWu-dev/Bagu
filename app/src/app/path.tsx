import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoursePath } from '@/components/course-path';
import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { transformerLessons } from '@/data/transformer-course';
import { colors } from '@/theme/colors';
import type { Lesson } from '@/types/course';

export default function LearningPathScreen() {
  const { completedLessonIds, isUnlocked } = useProgress();
  const openLesson = (lesson: Lesson) => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } });

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="返回" onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>‹</Text></Pressable>
          <View style={styles.headerCopy}><Text style={styles.headerEyebrow}>TRANSFORMER · 第 1 单元</Text><Text style={styles.headerTitle}>Attention 基础路径</Text></View>
          <Text style={styles.progress}>{completedLessonIds.length}/{transformerLessons.length}</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.guideCard}><Text style={styles.guideTitle}>从理解到能表达</Text><Text style={styles.guideText}>按顺序解锁节点。每次只做一道主动回忆题，再用关键词补齐答案。</Text></View>
          <CoursePath lessons={transformerLessons} completedLessonIds={completedLessonIds} isUnlocked={isUnlocked} onSelect={openLesson} />
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, header: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.text, fontSize: 34, lineHeight: 38 }, headerCopy: { flex: 1 }, headerEyebrow: { color: colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }, headerTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 3 }, progress: { color: colors.primary, backgroundColor: colors.primarySoft, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, fontSize: 10, fontWeight: '900' },
  content: { padding: 18, paddingBottom: 30 }, guideCard: { backgroundColor: colors.primarySoft, borderRadius: 17, padding: 15 }, guideTitle: { color: colors.primaryDark, fontSize: 13, fontWeight: '900' }, guideText: { color: colors.textMuted, fontSize: 10, lineHeight: 16, marginTop: 4 },
});
