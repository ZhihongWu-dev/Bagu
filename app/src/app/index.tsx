import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { CoursePath } from '@/components/course-path';
import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { transformerLessons } from '@/data/transformer-course';
import { colors } from '@/theme/colors';
import type { Lesson } from '@/types/course';

export default function HomeScreen() {
  const { completedLessonIds, xp, streak, focus, isUnlocked } = useProgress();

  const openLesson = (lesson: Lesson) => {
    router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } });
  };

  const currentLesson = transformerLessons.find(
    (lesson) => isUnlocked(lesson.id) && !completedLessonIds.includes(lesson.id),
  );

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statIcon}>🔥</Text><Text style={styles.statText}>{streak}</Text></View>
          <View style={styles.stat}><Text style={styles.statIcon}>💎</Text><Text style={styles.statText}>{xp}</Text></View>
          <View style={styles.stat}><Text style={styles.statIcon}>⚡</Text><Text style={styles.statText}>{focus}/5</Text></View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.hero}>
            <View style={styles.heroCopy}>
              <Text style={styles.kicker}>TRANSFORMER · 第 1 单元</Text>
              <Text style={styles.heroTitle}>{currentLesson?.shortTitle ?? '今日任务完成'}</Text>
              <Text style={styles.heroSubtitle}>
                {currentLesson ? `约 ${currentLesson.duration} 分钟 · 继续你的学习路径` : '做得很好，明天继续保持'}
              </Text>
            </View>
            <View style={styles.guideButton}><Text style={styles.guideButtonText}>学习指南</Text></View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>核心机制</Text>
              <Text style={styles.sectionTitle}>Attention 基础路径</Text>
            </View>
            <Text style={styles.progressText}>{completedLessonIds.length}/{transformerLessons.length}</Text>
          </View>

          <CoursePath
            lessons={transformerLessons}
            completedLessonIds={completedLessonIds}
            isUnlocked={isUnlocked}
            onSelect={openLesson}
          />
        </ScrollView>
        <BottomNav />
      </SafeAreaView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  stats: {
    height: 58,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statIcon: { fontSize: 18 },
  statText: { color: colors.textMuted, fontWeight: '900', fontSize: 14 },
  scrollContent: { padding: 18, paddingBottom: 30 },
  hero: {
    minHeight: 134,
    padding: 20,
    borderRadius: 24,
    backgroundColor: colors.primary,
    borderBottomWidth: 7,
    borderBottomColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCopy: { flex: 1, paddingRight: 10 },
  kicker: { color: '#DCD5FF', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  heroTitle: { color: colors.surface, fontSize: 24, fontWeight: '900', marginTop: 8 },
  heroSubtitle: { color: '#E8E3FF', fontSize: 12, marginTop: 6, lineHeight: 18 },
  guideButton: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 13 },
  guideButtonText: { color: colors.primaryDark, fontSize: 11, fontWeight: '900' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 28,
    paddingHorizontal: 4,
  },
  sectionEyebrow: { color: colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 5 },
  progressText: { color: colors.primary, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, fontWeight: '900' },
});

