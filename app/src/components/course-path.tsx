import { StyleSheet, View } from 'react-native';

import { LessonNode } from '@/components/lesson-node';
import { UnitBanner } from '@/components/unit-banner';
import type { CourseSection, Lesson } from '@/types/course';

type Props = {
  section: CourseSection;
  completedLessonIds: string[];
  isUnlocked: (lessonId: string) => boolean;
  onSelect: (lesson: Lesson) => void;
};

const offsets = [42, -42];

export function CoursePath({ section, completedLessonIds, isUnlocked, onSelect }: Props) {
  return (
    <View style={styles.section}>
      {section.units.map((unit) => {
        const completedInUnit = unit.lessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length;
        return (
          <View key={unit.id} style={styles.unit}>
            <UnitBanner compact title={unit.title} subtitle={unit.description} completed={completedInUnit} total={unit.lessons.length} color={unit.color} darkColor={unit.darkColor} />
            <View style={styles.path}>
              <View style={[styles.guide, { backgroundColor: unit.softColor }]} />
              {unit.lessons.map((lesson, index) => {
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
                    accentColor={unit.color}
                    accentDarkColor={unit.darkColor}
                    onPress={() => onSelect(lesson)}
                  />
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 18 },
  unit: { gap: 4 },
  path: { alignItems: 'center', paddingTop: 20, paddingBottom: 8, minHeight: 285 },
  guide: { position: 'absolute', top: 63, bottom: 66, width: 7, borderRadius: 8 },
});
