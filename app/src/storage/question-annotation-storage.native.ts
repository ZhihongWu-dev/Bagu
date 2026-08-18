import { File, Paths } from 'expo-file-system';

import { normalizeQuestionAnnotationState } from '@/question-review/annotation-data';
import type { QuestionAnnotationState } from '@/question-review/types';

const annotationFile = new File(Paths.document, 'bagu-question-annotations-v1.json');

export async function loadQuestionAnnotations(): Promise<QuestionAnnotationState | null> {
  if (!annotationFile.exists) return null;
  try {
    return normalizeQuestionAnnotationState(JSON.parse(await annotationFile.text()));
  } catch {
    return null;
  }
}

export async function saveQuestionAnnotations(state: QuestionAnnotationState): Promise<void> {
  const normalized = normalizeQuestionAnnotationState(state);
  annotationFile.write(JSON.stringify(normalized));
}

export async function clearQuestionAnnotations(): Promise<void> {
  if (annotationFile.exists) annotationFile.delete();
}
