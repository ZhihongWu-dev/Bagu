import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoursePath } from '@/components/course-path';
import { LearningStatusBar } from '@/components/learning-status-bar';
import { ScreenShell } from '@/components/screen-shell';
import { UnitBanner } from '@/components/unit-banner';
import { useProgress } from '@/context/progress-context';
import { transformerLessons } from '@/data/transformer-course';
import type { Lesson } from '@/types/course';

export default function LearningScreen() {
  const { completedLessonIds, xp, streak, focus, isUnlocked } = useProgress();
  const openLesson = (lesson: Lesson) => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } });

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <LearningStatusBar streak={streak} xp={xp} focus={focus} />
          <UnitBanner title="Transformer" completed={completedLessonIds.length} total={transformerLessons.length} />
          <CoursePath
            lessons={transformerLessons}
            completedLessonIds={completedLessonIds}
            isUnlocked={isUnlocked}
            onSelect={openLesson}
          />
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { gap: 14, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 28 },
});
