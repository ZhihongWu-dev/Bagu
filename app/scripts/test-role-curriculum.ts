import { getLearningUnits, getLessonOrder } from '../src/data/course-catalog';
import { normalizePersistedProgress } from '../src/storage/progress-data';
import { hasCompletedPrerequisites } from '../src/domain/course-progression';

const failures: string[] = [];
const check = (condition: unknown, message: string) => { if (!condition) failures.push(message); };

const algorithmOrder = getLessonOrder('llm_algorithm');
const applicationOrder = getLessonOrder('llm_application');
check(algorithmOrder.length === 50, 'Algorithm combined path must contain 50 nodes.');
check(applicationOrder.length === 89, 'Application combined path must contain 89 nodes.');
check(algorithmOrder.slice(0, 25).join('|') === applicationOrder.slice(0, 25).join('|'), 'The first 25 shared nodes must match.');
check(algorithmOrder[25].startsWith('alg-'), 'Algorithm specialist path must follow the shared path.');
check(applicationOrder[25].startsWith('app-'), 'Application specialist path must follow the shared path.');
check(getLearningUnits('llm_algorithm').length === 2, 'A role path must compose shared and specialist units.');

const firstShared = algorithmOrder[0];
const lastShared = algorithmOrder[24];
const firstAlgorithm = algorithmOrder[25];
check(hasCompletedPrerequisites(firstShared, algorithmOrder, []), 'First shared node must start unlocked.');
check(!hasCompletedPrerequisites(firstAlgorithm, algorithmOrder, algorithmOrder.slice(0, 24)), 'Specialist path must stay locked until all shared nodes are complete.');
check(hasCompletedPrerequisites(firstAlgorithm, algorithmOrder, algorithmOrder.slice(0, 25)), 'First specialist node must unlock after shared completion.');
check(hasCompletedPrerequisites(lastShared, applicationOrder, applicationOrder.slice(0, 24)), 'Shared progression must behave identically in both roles.');

const migrated = normalizePersistedProgress({ completedLessonIds: ['attention-scale'], xp: 30, reviewSchedule: {} });
check(migrated?.targetRole === null, 'Legacy progress without a role must migrate to null.');
check(migrated?.completedLessonIds.includes('attention-scale'), 'Legacy completion must be retained.');
check(normalizePersistedProgress({ targetRole: 'invalid', completedLessonIds: [], xp: 0, reviewSchedule: {} })?.targetRole === null, 'Invalid roles must normalize to null.');
check(normalizePersistedProgress({ targetRole: 'llm_application', completedLessonIds: [], xp: 0, reviewSchedule: {} })?.targetRole === 'llm_application', 'Valid role must persist.');
const normalizedResume = normalizePersistedProgress({ completedLessonIds: [], xp: 0, reviewSchedule: {}, resumeAnalysis: { sourceName: 'cv.pdf', technologies: ['Redis'], responsibilities: [], metrics: [], topicIds: ['app-cache-redis', 'private-value'], followUps: [], confidence: 8, confirmed: true } })?.resumeAnalysis;
check(normalizedResume?.confidence === 1, 'Resume confidence must be clamped.');
check(normalizedResume?.topicIds.join('|') === 'app-cache-redis', 'Resume recommendations must accept only application topic ids.');
check(normalizePersistedProgress({ completedLessonIds: [], xp: 0, reviewSchedule: {}, resumeAnalysis: { technologies: ['Redis'] } })?.resumeAnalysis === null, 'Malformed resume analysis must be discarded.');

if (failures.length) {
  console.error(`Role curriculum tests failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Role curriculum tests passed: migration, composition, shared progression, and specialist boundary.');
