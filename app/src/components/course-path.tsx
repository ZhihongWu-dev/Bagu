import { StyleSheet, View } from 'react-native';

import { LessonNode } from '@/components/lesson-node';
import { UnitBanner } from '@/components/unit-banner';
import type { CourseUnit, LearningNode } from '@/types/course';

type Props = {
  unit: CourseUnit;
  completedLessonIds: string[];
  isUnlocked: (lessonId: string) => boolean;
  onSelect: (node: LearningNode) => void;
};

const offsets = [0, 46, 0, -46, 0];

export function CoursePath({ unit, completedLessonIds, isUnlocked, onSelect }: Props) {
  return (
    <View style={styles.section}>
      {unit.sections.map((section) => {
        const completedInSection = section.nodes.filter((node) => completedLessonIds.includes(node.id)).length;
        return (
          <View key={section.id} style={styles.unit}>
            <UnitBanner compact title={section.title} subtitle={section.description} completed={completedInSection} total={section.nodes.length} color={section.color} darkColor={section.darkColor} />
            <View style={styles.path}>
              {section.nodes.map((node, index) => {
                const completed = completedLessonIds.includes(node.id);
                const unlocked = isUnlocked(node.id);
                const current = unlocked && !completed;
                return (
                  <LessonNode
                    key={node.id}
                    node={node}
                    completed={completed}
                    current={current}
                    unlocked={unlocked}
                    offset={offsets[index % offsets.length]}
                    accentColor={section.color}
                    accentDarkColor={section.darkColor}
                    onPress={() => onSelect(node)}
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
  path: { alignItems: 'center', paddingTop: 20, paddingBottom: 8, minHeight: 610 },
});
