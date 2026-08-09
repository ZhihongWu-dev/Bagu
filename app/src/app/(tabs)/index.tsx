import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { transformerLessons } from '@/data/transformer-course';
import { colors } from '@/theme/colors';

export default function HomeScreen() {
  const { completedLessonIds, xp, streak, reviewQueue, projectProfile, isUnlocked } = useProgress();
  const currentLesson = transformerLessons.find(
    (lesson) => isUnlocked(lesson.id) && !completedLessonIds.includes(lesson.id),
  );
  const progress = completedLessonIds.length / transformerLessons.length;

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>BAGU</Text>
              <Text style={styles.greeting}>晚上好，继续积累</Text>
            </View>
            <View style={styles.streakBadge}><Text style={styles.streakIcon}>🔥</Text><Text style={styles.streakText}>{streak}</Text></View>
          </View>

          <Pressable onPress={() => router.push('/today')} style={({ pressed }) => [styles.todayCard, pressed && styles.pressed]}>
            <View style={styles.todayTop}>
              <Text style={styles.todayEyebrow}>TODAY · 今日学习</Text>
              <Text style={styles.todayCount}>{completedLessonIds.length}/{transformerLessons.length}</Text>
            </View>
            <Text style={styles.todayTitle}>{currentLesson?.shortTitle ?? '今日任务已完成'}</Text>
            <Text style={styles.todayText}>{currentLesson ? `下一步约 ${currentLesson.duration} 分钟，只专注完成一件事。` : '可以去复习队列巩固已经学过的内容。'}</Text>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(8, progress * 100)}%` }]} /></View>
            <View style={styles.todayAction}><Text style={styles.todayActionText}>查看今日计划</Text><Text style={styles.todayArrow}>→</Text></View>
          </Pressable>

          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={styles.statValue}>{xp}</Text><Text style={styles.statLabel}>总 XP</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{reviewQueue.length}</Text><Text style={styles.statLabel}>待复习</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{projectProfile ? '1' : '0'}</Text><Text style={styles.statLabel}>项目档案</Text></View>
          </View>

          <Text style={styles.sectionTitle}>学习模块</Text>
          <Pressable onPress={() => router.push('/library')} style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}>
            <View style={styles.generalIcon}><Text style={styles.moduleIconText}>∞</Text></View>
            <View style={styles.moduleCopy}>
              <Text style={styles.moduleTag}>无需简历</Text>
              <Text style={styles.moduleTitle}>通用八股</Text>
              <Text style={styles.moduleText}>六大方向的结构化知识卡与追问</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/resume')} style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}>
            <View style={styles.projectIcon}><Text style={styles.moduleIconText}>P</Text></View>
            <View style={styles.moduleCopy}>
              <Text style={[styles.moduleTag, styles.projectTag]}>{projectProfile ? '档案已建立' : '可选模块'}</Text>
              <Text style={styles.moduleTitle}>简历项目深挖</Text>
              <Text style={styles.moduleText}>{projectProfile?.name ?? '围绕真实项目准备技术追问'}</Text>
            </View>
            <Text style={[styles.chevron, styles.projectChevron]}>›</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/interview')} style={({ pressed }) => [styles.interviewCard, pressed && styles.pressed]}>
            <View>
              <Text style={styles.interviewTag}>MOCK INTERVIEW</Text>
              <Text style={styles.interviewTitle}>开始模拟面试</Text>
              <Text style={styles.interviewText}>通用、简历与综合三种模式</Text>
            </View>
            <View style={styles.interviewArrow}><Text style={styles.interviewArrowText}>→</Text></View>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 20, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  brand: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  greeting: { color: colors.text, fontSize: 23, fontWeight: '900', marginTop: 4 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 13, paddingHorizontal: 11, paddingVertical: 8 },
  streakIcon: { fontSize: 15 }, streakText: { color: colors.text, fontWeight: '900' },
  todayCard: { backgroundColor: colors.primary, borderBottomWidth: 7, borderBottomColor: colors.primaryDark, borderRadius: 24, padding: 20 },
  todayTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  todayEyebrow: { color: '#DED8FF', fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  todayCount: { color: colors.surface, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5, fontSize: 10, fontWeight: '900' },
  todayTitle: { color: colors.surface, fontSize: 26, fontWeight: '900', marginTop: 16 },
  todayText: { color: '#E8E4FF', fontSize: 12, lineHeight: 19, marginTop: 6 },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, overflow: 'hidden', marginTop: 17 },
  progressFill: { height: '100%', backgroundColor: colors.surface, borderRadius: 8 },
  todayAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 17 },
  todayActionText: { color: colors.surface, fontSize: 12, fontWeight: '900' }, todayArrow: { color: colors.surface, fontSize: 20, fontWeight: '900' },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 13 },
  statCard: { flex: 1, alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 15, paddingVertical: 12 },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '900' }, statLabel: { color: colors.textMuted, fontSize: 9, marginTop: 3 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 24, marginBottom: 10 },
  moduleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 18, padding: 14, marginBottom: 10 },
  generalIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  projectIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successSoft },
  moduleIconText: { color: colors.primary, fontSize: 19, fontWeight: '900' }, moduleCopy: { flex: 1 },
  moduleTag: { color: colors.primary, fontSize: 9, fontWeight: '900' }, projectTag: { color: colors.successDark },
  moduleTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 3 }, moduleText: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  chevron: { color: colors.primary, fontSize: 28 }, projectChevron: { color: colors.successDark },
  interviewCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 19, padding: 17, marginTop: 5 },
  interviewTag: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }, interviewTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 4 }, interviewText: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  interviewArrow: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, interviewArrowText: { color: colors.surface, fontSize: 19, fontWeight: '900' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
