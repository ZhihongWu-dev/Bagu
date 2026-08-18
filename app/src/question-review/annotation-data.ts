import {
  DEFAULT_ANNOTATION_BATCH_SIZE,
  QUESTION_ANNOTATION_SCHEMA_VERSION,
  type AnnotationProgress,
  type AnswerBasis,
  type CueType,
  type QuestionAnnotationInput,
  type QuestionAnnotationRecord,
  type QuestionAnnotationState,
  type Rating,
} from './types';

const ANSWER_BASES = new Set<AnswerBasis>(['reasoning', 'memory', 'answer-cue', 'elimination', 'random']);
const CUE_TYPES = new Set<CueType>([
  'none',
  'answer-repetition',
  'length',
  'wording',
  'formatting',
  'other',
]);

export function createQuestionAnnotationState(
  scopeId: string,
  questionIds: string[],
  now = new Date().toISOString(),
  batchSize = DEFAULT_ANNOTATION_BATCH_SIZE,
): QuestionAnnotationState {
  return {
    schemaVersion: QUESTION_ANNOTATION_SCHEMA_VERSION,
    scopeId: normalizeId(scopeId, 'scopeId'),
    questionIds: normalizeQuestionIds(questionIds),
    batchSize: normalizeBatchSize(batchSize),
    records: {},
    updatedAt: normalizeIsoDate(now, 'now'),
  };
}

export function upsertQuestionAnnotation(
  state: QuestionAnnotationState,
  questionId: string,
  questionVersion: number,
  input: QuestionAnnotationInput,
  now = new Date().toISOString(),
): QuestionAnnotationState {
  const normalized = normalizeQuestionAnnotationState(state);
  const index = normalized.questionIds.indexOf(questionId);
  if (index < 0) throw new Error(`Unknown annotation question: ${questionId}`);

  const record: QuestionAnnotationRecord = {
    ...normalizeAnnotationInput(input),
    questionId,
    questionVersion: normalizeQuestionVersion(questionVersion),
    batchNumber: Math.floor(index / normalized.batchSize) + 1,
    annotatedAt: normalizeIsoDate(now, 'annotatedAt'),
  };

  return {
    ...normalized,
    records: { ...normalized.records, [questionId]: record },
    updatedAt: record.annotatedAt,
  };
}

export function getAnnotationProgress(state: QuestionAnnotationState): AnnotationProgress {
  const normalized = normalizeQuestionAnnotationState(state);
  const completed = normalized.questionIds.filter((id) => normalized.records[id]).length;
  const total = normalized.questionIds.length;
  const batchCount = Math.ceil(total / normalized.batchSize);
  const resumeIndex = normalized.questionIds.findIndex((id) => !normalized.records[id]);
  let completedBatches = 0;

  for (let batchIndex = 0; batchIndex < batchCount; batchIndex += 1) {
    const ids = normalized.questionIds.slice(
      batchIndex * normalized.batchSize,
      (batchIndex + 1) * normalized.batchSize,
    );
    if (ids.length > 0 && ids.every((id) => normalized.records[id])) completedBatches += 1;
  }

  return {
    total,
    completed,
    remaining: total - completed,
    completionRate: total === 0 ? 0 : completed / total,
    batchCount,
    completedBatches,
    currentBatch: resumeIndex < 0 ? null : Math.floor(resumeIndex / normalized.batchSize) + 1,
    resumeQuestionId: resumeIndex < 0 ? null : normalized.questionIds[resumeIndex],
  };
}

export function getAnnotationBatch(state: QuestionAnnotationState, batchNumber: number): string[] {
  const normalized = normalizeQuestionAnnotationState(state);
  if (!Number.isInteger(batchNumber) || batchNumber < 1) return [];
  const start = (batchNumber - 1) * normalized.batchSize;
  return normalized.questionIds.slice(start, start + normalized.batchSize);
}

export function normalizeQuestionAnnotationState(value: unknown): QuestionAnnotationState {
  if (!isRecord(value)) throw new Error('Invalid question annotation state');
  if (value.schemaVersion !== QUESTION_ANNOTATION_SCHEMA_VERSION) {
    throw new Error('Unsupported question annotation schema version');
  }

  const questionIds = normalizeQuestionIds(value.questionIds);
  const batchSize = normalizeBatchSize(value.batchSize);
  const questionIdSet = new Set(questionIds);
  const records: Record<string, QuestionAnnotationRecord> = {};

  if (!isRecord(value.records)) throw new Error('Invalid annotation records');
  for (const [key, raw] of Object.entries(value.records)) {
    if (!questionIdSet.has(key)) continue;
    const record = normalizeRecord(raw, questionIds, batchSize);
    if (record.questionId !== key) throw new Error('Annotation record key mismatch');
    records[key] = record;
  }

  return {
    schemaVersion: QUESTION_ANNOTATION_SCHEMA_VERSION,
    scopeId: normalizeId(value.scopeId, 'scopeId'),
    questionIds,
    batchSize,
    records,
    updatedAt: normalizeIsoDate(value.updatedAt, 'updatedAt'),
  };
}

function normalizeRecord(value: unknown, questionIds: string[], batchSize: number): QuestionAnnotationRecord {
  if (!isRecord(value)) throw new Error('Invalid annotation record');
  const questionId = normalizeId(value.questionId, 'questionId');
  const index = questionIds.indexOf(questionId);
  if (index < 0) throw new Error(`Unknown annotation question: ${questionId}`);
  const normalizedInput = normalizeAnnotationInput(value);
  return {
    ...normalizedInput,
    questionId,
    questionVersion: normalizeQuestionVersion(value.questionVersion),
    batchNumber: Math.floor(index / batchSize) + 1,
    annotatedAt: normalizeIsoDate(value.annotatedAt, 'annotatedAt'),
  };
}

function normalizeAnnotationInput(value: unknown): QuestionAnnotationInput {
  if (!isRecord(value)) throw new Error('Invalid annotation input');
  if (!ANSWER_BASES.has(value.answerBasis as AnswerBasis)) throw new Error('Invalid answer basis');
  if (!CUE_TYPES.has(value.cueType as CueType)) throw new Error('Invalid cue type');

  const note = typeof value.note === 'string' ? value.note.trim().slice(0, 1_000) : undefined;
  return {
    answerBasis: value.answerBasis as AnswerBasis,
    clarity: normalizeRating(value.clarity, 'clarity'),
    multipleAnswerSuspicion: normalizeBoolean(value.multipleAnswerSuspicion, 'multipleAnswerSuspicion'),
    distractorPlausibility: normalizeRating(value.distractorPlausibility, 'distractorPlausibility'),
    cueType: value.cueType as CueType,
    explanationHelpfulness: normalizeRating(value.explanationHelpfulness, 'explanationHelpfulness'),
    perceivedDifficulty: normalizeRating(value.perceivedDifficulty, 'perceivedDifficulty'),
    ...(note ? { note } : {}),
  };
}

function normalizeQuestionIds(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error('questionIds must be an array');
  const ids = value.map((id) => normalizeId(id, 'questionId'));
  if (new Set(ids).size !== ids.length) throw new Error('questionIds must be unique');
  return ids;
}

function normalizeId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9._:-]{1,100}$/.test(value)) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function normalizeRating(value: unknown, field: string): Rating {
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 5) {
    throw new Error(`${field} must be an integer from 1 to 5`);
  }
  return value as Rating;
}

function normalizeBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${field} must be boolean`);
  return value;
}

function normalizeQuestionVersion(value: unknown): number {
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 10_000) {
    throw new Error('Invalid questionVersion');
  }
  return Number(value);
}

function normalizeBatchSize(value: unknown): number {
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 100) {
    throw new Error('Invalid annotation batch size');
  }
  return Number(value);
}

function normalizeIsoDate(value: unknown, field: string): string {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value)) || value.length > 30) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
