import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { transformerLessons } from '@/data/transformer-course';
import { colors } from '@/theme/colors';

export default function ReviewScreen() {
  const { reviewSchedule } = useProgress();
  const reviewItems = Object.entries(reviewSchedule)
    .map(([lessonId, date]) => ({ lesson: transformerLessons.find((item) => item.id === lessonId), date }))
    .filter((item) => item.lesson);

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>SPACED REPETITION</Text>
          <Text style={styles.title}>今日复习</Text>
          <Text style={styles.subtitle}>通过间隔复习，把“看过”变成面试时能说出来。</Text>

          <View style={styles.summary}>
            <View><Text style={styles.summaryValue}>{reviewItems.length}</Text><Text style={styles.summaryLabel}>已安排知识点</Text></View>
            <View style={styles.summaryBadge}><Text style={styles.summaryBadgeText}>明日到期</Text></View>
          </View>

          {reviewItems.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>◆</Text>
              <Text style={styles.emptyTitle}>复习队列还是空的</Text>
              <Text style={styles.emptyText}>完成第一节课程后，知识点会自动安排到明天复习。</Text>
              <Pressable onPress={() => router.replace('/')} style={styles.button}>
                <Text style={styles.buttonText}>去完成今日课程</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.list}>
              {reviewItems.map(({ lesson, date }) => lesson && (
                <View key={lesson.id} style={styles.reviewCard}>
                  <View style={styles.lessonIcon}><Text style={styles.lessonIconText}>{lesson.icon}</Text></View>
                  <View style={styles.lessonCopy}>
                    <Text style={styles.lessonTitle}>{lesson.shortTitle}</Text>
                    <Text style={styles.lessonDate}>{new Date(date).toLocaleDateString('zh-CN')} 复习</Text>
                  </View>
                  <Text style={styles.scheduled}>已安排</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        <BottomNav />
      </SafeAreaView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 22, paddingBottom: 35 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 6 },
  subtitle: { color: colors.textMuted, lineHeight: 21, marginTop: 8 },
  summary: { backgroundColor: colors.primary, borderBottomWidth: 7, borderBottomColor: colors.primaryDark, borderRadius: 22, padding: 19, marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryValue: { color: colors.surface, fontSize: 28, fontWeight: '900' },
  summaryLabel: { color: '#DFD9FF', fontSize: 11, marginTop: 3 },
  summaryBadge: { backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8 },
  summaryBadgeText: { color: colors.primaryDark, fontSize: 11, fontWeight: '900' },
  empty: { alignItems: 'center', backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 22, padding: 26, marginTop: 18 },
  emptyIcon: { color: colors.primary, fontSize: 35 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 12 },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginTop: 7 },
  button: { alignSelf: 'stretch', alignItems: 'center', backgroundColor: colors.primary, borderBottomWidth: 5, borderBottomColor: colors.primaryDark, borderRadius: 15, padding: 15, marginTop: 20 },
  buttonText: { color: colors.surface, fontWeight: '900' },
  list: { gap: 11, marginTop: 18 },
  reviewCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 18, padding: 14 },
  lessonIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.currentSoft },
  lessonIconText: { color: colors.currentDark, fontSize: 18, fontWeight: '900' },
  lessonCopy: { flex: 1, marginLeft: 12 },
  lessonTitle: { color: colors.text, fontWeight: '900' },
  lessonDate: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  scheduled: { color: colors.successDark, backgroundColor: colors.successSoft, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, fontSize: 10, fontWeight: '900' },
});

