import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoursePath } from '@/components/course-path';
import { LearningStatusBar } from '@/components/learning-status-bar';
import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { getLearningUnits } from '@/data/course-catalog';
import type { LearningNode } from '@/types/course';

export default function LearningScreen() {
  const { completedLessonIds, streak, isUnlocked, targetRole } = useProgress();
  const openLesson = (node: LearningNode) => router.push({ pathname: '/lesson/[id]', params: { id: node.id } });

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <LearningStatusBar streak={streak} />
          {targetRole ? getLearningUnits(targetRole).map((unit) => (
            <CoursePath
              key={unit.id}
              unit={unit}
              completedLessonIds={completedLessonIds}
              isUnlocked={isUnlocked}
              onSelect={openLesson}
            />
          )) : null}
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { gap: 14, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 28 },
});
