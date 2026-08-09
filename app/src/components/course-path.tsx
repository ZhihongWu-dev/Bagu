import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Lesson } from '@/types/course';
import { colors } from '@/theme/colors';

type Props = {
  lessons: Lesson[];
  completedLessonIds: string[];
  isUnlocked: (lessonId: string) => boolean;
  onSelect: (lesson: Lesson) => void;
};

const offsets = [0, -62, 58, -25];

export function CoursePath({ lessons, completedLessonIds, isUnlocked, onSelect }: Props) {
  return (
    <View style={styles.path}>
      <View style={styles.guide} />
      {lessons.map((lesson, index) => {
        const completed = completedLessonIds.includes(lesson.id);
        const unlocked = isUnlocked(lesson.id);
        const current = unlocked && !completed;
        return (
          <View key={lesson.id} style={[styles.row, { transform: [{ translateX: offsets[index] ?? 0 }] }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${lesson.shortTitle}${unlocked ? '' : '，尚未解锁'}`}
              disabled={!unlocked}
              onPress={() => onSelect(lesson)}
              style={({ pressed }) => [
                styles.node,
                completed && styles.completed,
                current && styles.current,
                !unlocked && styles.locked,
                pressed && unlocked && styles.pressed,
              ]}>
              <Text style={[styles.nodeText, !unlocked && styles.lockedText]}>
                {completed ? '✓' : unlocked ? lesson.icon : '🔒'}
              </Text>
            </Pressable>
            <Text style={[styles.title, current && styles.currentTitle]}>{lesson.shortTitle}</Text>
            {current && <Text style={styles.startHint}>点击开始 · {lesson.duration} 分钟</Text>}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  path: { alignItems: 'center', paddingTop: 20, paddingBottom: 38, minHeight: 420 },
  guide: {
    position: 'absolute',
    top: 45,
    bottom: 72,
    width: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  row: { alignItems: 'center', minHeight: 132, zIndex: 1 },
  node: {
    width: 78,
    height: 72,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderBottomWidth: 7,
    borderBottomColor: '#C9C1E7',
  },
  completed: { backgroundColor: colors.success, borderBottomColor: colors.successDark },
  current: {
    backgroundColor: colors.current,
    borderBottomColor: colors.currentDark,
    ...Platform.select({
      web: { boxShadow: '0 8px 18px rgba(255, 181, 38, 0.35)' },
      default: { shadowColor: colors.current, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
    }),
  },
  locked: { backgroundColor: '#E9E6EF', borderBottomColor: '#D1CBD9' },
  pressed: { transform: [{ translateY: 4 }], borderBottomWidth: 3 },
  nodeText: { color: colors.surface, fontSize: 25, fontWeight: '900' },
  lockedText: { fontSize: 20, opacity: 0.55 },
  title: { marginTop: 10, color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  currentTitle: { color: colors.text },
  startHint: { marginTop: 4, color: colors.currentDark, fontSize: 11, fontWeight: '700' },
});
