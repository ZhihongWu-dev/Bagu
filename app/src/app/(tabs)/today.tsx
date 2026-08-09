import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { transformerLessons } from '@/data/transformer-course';
import { colors } from '@/theme/colors';

export default function TodayScreen() {
  const { completedLessonIds, reviewQueue, reviewSchedule, projectProfile, isUnlocked } = useProgress();
  const currentLesson = transformerLessons.find(
    (lesson) => isUnlocked(lesson.id) && !completedLessonIds.includes(lesson.id),
  );
  const reviewCount = Math.max(reviewQueue.length, Object.keys(reviewSchedule).length);

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>DAILY PLAN</Text>
          <Text style={styles.title}>今天练什么</Text>
          <Text style={styles.subtitle}>只安排三件事。完成一项，再进入下一项。</Text>

          <View style={styles.summaryCard}>
            <View><Text style={styles.summaryValue}>{currentLesson ? '约 15' : '约 8'}</Text><Text style={styles.summaryLabel}>分钟</Text></View>
            <View style={styles.summaryDivider} />
            <View><Text style={styles.summaryValue}>3</Text><Text style={styles.summaryLabel}>今日任务</Text></View>
            <View style={styles.summaryDivider} />
            <View><Text style={styles.summaryValue}>{completedLessonIds.length}</Text><Text style={styles.summaryLabel}>已通关</Text></View>
          </View>

          <Text style={styles.sectionTitle}>今日任务</Text>
          <TaskCard
            index="01"
            color={colors.primary}
            softColor={colors.primarySoft}
            tag="通用课程"
            title={currentLesson?.shortTitle ?? 'Transformer 路径已完成'}
            description={currentLesson?.subtitle ?? '回到完整路径回顾已学节点。'}
            meta={currentLesson ? `${currentLesson.duration} 分钟` : '自由复习'}
            action="查看学习路径"
            onPress={() => router.push('/path')}
          />
          <TaskCard
            index="02"
            color={colors.currentDark}
            softColor={colors.currentSoft}
            tag="间隔复习"
            title={reviewCount ? `${reviewCount} 个知识点待巩固` : '建立第一条复习记录'}
            description={reviewCount ? '课程、知识卡和项目追问都在同一个队列。' : '完成课程或把知识卡加入复习计划。'}
            meta="约 5 分钟"
            action="进入复习"
            onPress={() => router.push('/review')}
          />
          <TaskCard
            index="03"
            color={colors.successDark}
            softColor={colors.successSoft}
            tag="项目表达"
            title={projectProfile?.name ?? '建立项目档案'}
            description={projectProfile ? '用背景、贡献、难点和指标复述一次项目。' : '这是可选任务，不影响通用八股学习。'}
            meta={projectProfile ? '约 3 分钟' : '可选'}
            action={projectProfile ? '项目深挖' : '稍后完善'}
            onPress={() => router.push('/resume')}
          />

          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>✦</Text>
            <View style={styles.tipCopy}><Text style={styles.tipTitle}>今日建议</Text><Text style={styles.tipText}>面试复习优先“说出来”，不要只看答案。每题先口述 30 秒。</Text></View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}

function TaskCard({ index, color, softColor, tag, title, description, meta, action, onPress }: { index: string; color: string; softColor: string; tag: string; title: string; description: string; meta: string; action: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.taskCard, pressed && styles.pressed]}>
      <View style={[styles.taskIndex, { backgroundColor: softColor }]}><Text style={[styles.taskIndexText, { color }]}>{index}</Text></View>
      <View style={styles.taskCopy}>
        <View style={styles.taskMeta}><Text style={[styles.taskTag, { color }]}>{tag}</Text><Text style={styles.taskTime}>{meta}</Text></View>
        <Text style={styles.taskTitle}>{title}</Text>
        <Text style={styles.taskDescription}>{description}</Text>
        <Text style={[styles.taskAction, { color }]}>{action}  →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, content: { padding: 20, paddingBottom: 28 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, title: { color: colors.text, fontSize: 29, fontWeight: '900', marginTop: 6 }, subtitle: { color: colors.textMuted, lineHeight: 20, marginTop: 7 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: colors.primary, borderBottomWidth: 6, borderBottomColor: colors.primaryDark, borderRadius: 20, paddingVertical: 17, marginTop: 20 },
  summaryValue: { color: colors.surface, fontSize: 18, fontWeight: '900', textAlign: 'center' }, summaryLabel: { color: '#DED8FF', fontSize: 9, marginTop: 3, textAlign: 'center' }, summaryDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 24, marginBottom: 10 },
  taskCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 19, padding: 15, marginBottom: 11 },
  taskIndex: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, taskIndexText: { fontSize: 12, fontWeight: '900' }, taskCopy: { flex: 1 }, taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 }, taskTag: { fontSize: 9, fontWeight: '900' }, taskTime: { color: colors.textMuted, fontSize: 9 }, taskTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 5 }, taskDescription: { color: colors.textMuted, fontSize: 10, lineHeight: 16, marginTop: 5 }, taskAction: { fontSize: 10, fontWeight: '900', marginTop: 10 },
  tipCard: { flexDirection: 'row', gap: 11, backgroundColor: colors.surfaceMuted, borderRadius: 17, padding: 14, marginTop: 5 }, tipIcon: { color: colors.primary, fontSize: 20 }, tipCopy: { flex: 1 }, tipTitle: { color: colors.text, fontSize: 12, fontWeight: '900' }, tipText: { color: colors.textMuted, fontSize: 10, lineHeight: 16, marginTop: 4 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
