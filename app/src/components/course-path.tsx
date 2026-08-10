import { StyleSheet, View } from 'react-native';

import { LessonNode } from '@/components/lesson-node';
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
          <LessonNode
            key={lesson.id}
            lesson={lesson}
            completed={completed}
            current={current}
            unlocked={unlocked}
            offset={offsets[index] ?? 0}
            onPress={() => onSelect(lesson)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  path: { alignItems: 'center', paddingTop: 24, paddingBottom: 26, minHeight: 420 },
  guide: {
    position: 'absolute',
    top: 72,
    bottom: 78,
    width: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
});
