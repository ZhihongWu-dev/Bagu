import assert from 'node:assert/strict';

import {
  applyHeartPenalty,
  calculateRecentAccuracy,
  calculateStreak,
  recordNodePerformance,
  selectPracticeLength,
  type NodePerformanceEntry,
} from '../src/domain/learning-motivation';
import { canAccessLesson, hasCompletedPrerequisites, repairSequentialCompletions } from '../src/domain/course-progression';
import { transformerNodes } from '../src/data/transformer-course';
import { normalizePersistedProgress } from '../src/storage/progress-data';
import { buildAdaptivePracticeSession, restartPracticeSession } from '../src/utils/practice-session';
import type { LearningNode } from '../src/types/course';

const entry = (correct: number, total = 10): NodePerformanceEntry => ({
  completedAt: '2026-08-15T12:00:00.000Z',
  correct,
  total,
  incorrectExerciseIds: [],
});

assert.equal(selectPracticeLength([]), 10);
assert.equal(selectPracticeLength([entry(6)]), 8);
assert.equal(selectPracticeLength([entry(7)]), 10);
assert.equal(selectPracticeLength([entry(9)]), 12);
assert.equal(calculateRecentAccuracy([entry(0), entry(0), entry(0), entry(0), entry(0), entry(10)]), 0.2);

let hearts = 5;
for (let index = 0; index < 5; index += 1) hearts = applyHeartPenalty(hearts);
assert.equal(hearts, 0);
assert.equal(applyHeartPenalty(hearts), 0);

const lessonIds = ['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4'];
assert.equal(hasCompletedPrerequisites('lesson-1', lessonIds, []), true);
assert.equal(hasCompletedPrerequisites('lesson-2', lessonIds, ['lesson-1']), true);
assert.equal(hasCompletedPrerequisites('lesson-3', lessonIds, ['lesson-1', 'lesson-3']), false);
assert.equal(hasCompletedPrerequisites('lesson-4', lessonIds, ['lesson-1', 'lesson-3']), false);
assert.equal(canAccessLesson('lesson-3', lessonIds, ['lesson-1', 'lesson-3']), true);
assert.equal(canAccessLesson('lesson-4', lessonIds, ['lesson-1', 'lesson-2', 'lesson-3']), true);
assert.equal(canAccessLesson('missing', lessonIds, []), false);

const transformerLessonIds = transformerNodes.map((item) => item.id);
const firstSectionLessonIds = transformerLessonIds.slice(0, 5);
assert.equal(hasCompletedPrerequisites(transformerLessonIds[5], transformerLessonIds, firstSectionLessonIds), true);
assert.equal(hasCompletedPrerequisites(transformerLessonIds[6], transformerLessonIds, firstSectionLessonIds), false);

assert.deepEqual(calculateStreak({ current: 0, lastCompletedLocalDate: null }, '2026-08-15'), {
  streak: { current: 1, lastCompletedLocalDate: '2026-08-15' }, advanced: true,
});
assert.deepEqual(calculateStreak({ current: 4, lastCompletedLocalDate: '2026-08-15' }, '2026-08-15'), {
  streak: { current: 4, lastCompletedLocalDate: '2026-08-15' }, advanced: false,
});
assert.equal(calculateStreak({ current: 4, lastCompletedLocalDate: '2026-08-15' }, '2026-08-16').streak.current, 5);
assert.equal(calculateStreak({ current: 4, lastCompletedLocalDate: '2026-08-15' }, '2026-08-18').streak.current, 1);
assert.equal(calculateStreak({ current: 4, lastCompletedLocalDate: '2026-12-31' }, '2027-01-01').streak.current, 5);
assert.equal(calculateStreak({ current: 4, lastCompletedLocalDate: '2026-08-15' }, '2026-08-14').streak.current, 4);

const exercises = Array.from({ length: 12 }, (_, index) => ({
  id: `q${index + 1}`,
  type: 'self-recall' as const,
  eyebrow: '',
  prompt: '',
  explanation: '',
  coveredPoints: [],
  keywords: [],
  referencePoints: [],
}));
const node: LearningNode = { id: 'node', title: '', shortTitle: '', subtitle: '', icon: 'book', duration: 1, knowledgeIds: [], exercises };
const stats = recordNodePerformance(undefined, {
  completedAt: '2026-08-15T12:00:00.000Z',
  correct: 6,
  total: 10,
  incorrectExerciseIds: ['q9'],
  baseExerciseIds: exercises.slice(0, 10).map((exercise) => exercise.id),
});
let rollingStats = stats;
for (let index = 0; index < 6; index += 1) {
  rollingStats = recordNodePerformance(rollingStats, {
    completedAt: `2026-08-${String(16 + index).padStart(2, '0')}T12:00:00.000Z`,
    correct: 8,
    total: 10,
    incorrectExerciseIds: [],
    baseExerciseIds: ['q1'],
  });
}
assert.equal(rollingStats.recentSessions.length, 5);
assert.equal(rollingStats.exerciseUseCounts.q1, 7);
const adaptive = buildAdaptivePracticeSession(node, 0, stats);
assert.equal(adaptive.length, 8);
assert.equal(adaptive[0].exercise.id, 'q9');
assert.deepEqual(restartPracticeSession(adaptive, 1).map((item) => item.exercise.id), [
  ...adaptive.slice(1).map((item) => item.exercise.id),
  adaptive[0].exercise.id,
]);

const migrated = normalizePersistedProgress({
  completedLessonIds: ['node'],
  xp: 420,
  reviewSchedule: {},
});
assert.deepEqual(migrated?.completedLessonIds, ['node']);

assert.deepEqual(
  repairSequentialCompletions(
    [
      ['shared-1', 'shared-2', 'algorithm-1', 'algorithm-2'],
      ['shared-1', 'shared-2', 'application-1', 'application-2'],
    ],
    ['shared-1', 'algorithm-1', 'application-2'],
  ),
  ['shared-1'],
  'Disconnected completions must be removed when an earlier prerequisite is missing.',
);
assert.deepEqual(
  repairSequentialCompletions(
    [
      ['shared-1', 'shared-2', 'algorithm-1', 'algorithm-2'],
      ['shared-1', 'shared-2', 'application-1', 'application-2'],
    ],
    ['application-1', 'shared-2', 'algorithm-1', 'shared-1'],
  ),
  ['shared-1', 'shared-2', 'algorithm-1', 'application-1'],
  'Continuous progress from both specialist courses must be retained.',
);
assert.deepEqual(
  repairSequentialCompletions([['lesson-1', 'lesson-2']], ['unknown', 'lesson-1']),
  ['lesson-1'],
  'Unknown legacy lesson IDs must not affect the repaired course path.',
);
assert.equal(migrated?.xp, 420);
assert.equal(migrated?.learningMotivation?.streak.current, 0);

console.log('learning motivation tests passed');
