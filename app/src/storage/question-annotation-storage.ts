import { normalizeQuestionAnnotationState } from '@/question-review/annotation-data';
import type { QuestionAnnotationState } from '@/question-review/types';

const STORAGE_KEY = 'bagu-question-annotations-v1';

export async function loadQuestionAnnotations(): Promise<QuestionAnnotationState | null> {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return normalizeQuestionAnnotationState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveQuestionAnnotations(state: QuestionAnnotationState): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeQuestionAnnotationState(state)));
}

export async function clearQuestionAnnotations(): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
