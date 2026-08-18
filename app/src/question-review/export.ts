import { normalizeQuestionAnnotationState } from './annotation-data';
import type { QuestionAnnotationRecord, QuestionAnnotationState } from './types';

const CSV_COLUMNS = [
  'question_id',
  'question_version',
  'batch_number',
  'annotated_at',
  'answer_basis',
  'clarity',
  'multiple_answer_suspicion',
  'distractor_plausibility',
  'cue_type',
  'explanation_helpfulness',
  'perceived_difficulty',
  'note',
] as const;

export function exportAnnotationsAsJson(state: QuestionAnnotationState): string {
  const normalized = normalizeQuestionAnnotationState(state);
  return JSON.stringify(normalized, null, 2);
}

export function exportAnnotationsAsCsv(state: QuestionAnnotationState): string {
  const normalized = normalizeQuestionAnnotationState(state);
  const rows = normalized.questionIds
    .map((questionId) => normalized.records[questionId])
    .filter((record): record is QuestionAnnotationRecord => Boolean(record))
    .map((record) => [
      record.questionId,
      record.questionVersion,
      record.batchNumber,
      record.annotatedAt,
      record.answerBasis,
      record.clarity,
      record.multipleAnswerSuspicion,
      record.distractorPlausibility,
      record.cueType,
      record.explanationHelpfulness,
      record.perceivedDifficulty,
      record.note ?? '',
    ]);

  return [CSV_COLUMNS, ...rows]
    .map((row) => row.map((value) => escapeCsvCell(String(value))).join(','))
    .join('\r\n');
}

function escapeCsvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
