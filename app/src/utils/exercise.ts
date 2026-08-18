import type { Exercise } from '@/types/course';

const equalSets = (left: string[], right: string[]) => left.length === right.length && left.every((id) => right.includes(id));

export function isExerciseAnswerCorrect(exercise: Exercise, selectedIds: string[], orderedIds: string[]) {
  if (exercise.type === 'single-choice') return selectedIds[0] === exercise.correctChoiceId;
  if (exercise.type === 'multiple-choice') return equalSets(selectedIds, exercise.correctChoiceIds);
  if (exercise.type === 'ordering') return orderedIds.length === exercise.correctOrder.length && orderedIds.every((id, index) => id === exercise.correctOrder[index]);
  return true;
}

export function isExerciseReady(exercise: Exercise, selectedIds: string[], orderedIds: string[]) {
  if (exercise.type === 'self-recall') return true;
  if (exercise.type === 'ordering') return orderedIds.length === exercise.choices.length;
  return selectedIds.length > 0;
}
