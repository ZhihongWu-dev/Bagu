export function hasCompletedPrerequisites(
  lessonId: string,
  orderedLessonIds: readonly string[],
  completedLessonIds: readonly string[],
) {
  const lessonIndex = orderedLessonIds.indexOf(lessonId);
  if (lessonIndex < 0) return false;
  const completed = new Set(completedLessonIds);
  return orderedLessonIds.slice(0, lessonIndex).every((id) => completed.has(id));
}

export function canAccessLesson(
  lessonId: string,
  orderedLessonIds: readonly string[],
  completedLessonIds: readonly string[],
) {
  return completedLessonIds.includes(lessonId)
    || hasCompletedPrerequisites(lessonId, orderedLessonIds, completedLessonIds);
}

export function repairSequentialCompletions(
  courseOrders: readonly (readonly string[])[],
  completedLessonIds: readonly string[],
) {
  const completed = new Set(completedLessonIds);
  const repaired: string[] = [];
  const retained = new Set<string>();

  courseOrders.forEach((orderedLessonIds) => {
    for (const lessonId of orderedLessonIds) {
      if (!completed.has(lessonId)) break;
      if (!retained.has(lessonId)) {
        retained.add(lessonId);
        repaired.push(lessonId);
      }
    }
  });

  return repaired;
}
