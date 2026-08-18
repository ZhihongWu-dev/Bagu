export const QUESTION_ANNOTATION_SCHEMA_VERSION = 1;
export const DEFAULT_ANNOTATION_BATCH_SIZE = 10;

export type AnswerBasis = 'reasoning' | 'memory' | 'answer-cue' | 'elimination' | 'random';
export type Rating = 1 | 2 | 3 | 4 | 5;
export type CueType =
  | 'none'
  | 'answer-repetition'
  | 'length'
  | 'wording'
  | 'formatting'
  | 'other';

export type QuestionAnnotationInput = {
  answerBasis: AnswerBasis;
  clarity: Rating;
  multipleAnswerSuspicion: boolean;
  distractorPlausibility: Rating;
  cueType: CueType;
  explanationHelpfulness: Rating;
  perceivedDifficulty: Rating;
  note?: string;
};

export type QuestionAnnotationRecord = QuestionAnnotationInput & {
  questionId: string;
  questionVersion: number;
  batchNumber: number;
  annotatedAt: string;
};

export type QuestionAnnotationState = {
  schemaVersion: typeof QUESTION_ANNOTATION_SCHEMA_VERSION;
  scopeId: string;
  questionIds: string[];
  batchSize: number;
  records: Record<string, QuestionAnnotationRecord>;
  updatedAt: string;
};

export type AnnotationProgress = {
  total: number;
  completed: number;
  remaining: number;
  completionRate: number;
  batchCount: number;
  completedBatches: number;
  currentBatch: number | null;
  resumeQuestionId: string | null;
};
