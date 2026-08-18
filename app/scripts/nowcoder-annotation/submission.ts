import { isDeepStrictEqual } from 'node:util';
import type { SourceManifest, SourceManifestEntry, TopicId } from '../nowcoder-intake/types';
import type {
  AnswerCueType,
  CognitiveLevel,
  DistractorType,
  FollowUpType,
  ManualAnnotation,
  ManualAnnotationDataset,
  MisconceptionType,
  RecruitingStage,
  Relevance,
  Role,
  SkipReason,
} from './types';
import { validateAnnotation, validateDataset } from './validation';

export const ANNOTATION_SUBMISSION_ID = 'pilot-100-v1';
export const ANNOTATION_SUBMISSION_FILENAME = `${ANNOTATION_SUBMISSION_ID}.json`;
export const ANNOTATION_SUBMISSION_APP_PATH = `quality/nowcoder-intake/submissions/${ANNOTATION_SUBMISSION_FILENAME}`;
export const ANNOTATION_SUBMISSION_REPOSITORY_PATH = `app/${ANNOTATION_SUBMISSION_APP_PATH}`;

export interface PublicChoiceSignals {
  cognitiveLevel: CognitiveLevel;
  distractorTypes: DistractorType[];
  answerCueTypes: AnswerCueType[];
}

export interface AnnotationSubmissionRecord {
  sourceId: string;
  status: 'completed' | 'skipped';
  relevance?: Relevance;
  role?: Role;
  recruitingStage?: RecruitingStage;
  topicIds?: TopicId[];
  followUpTypes?: FollowUpType[];
  misconceptionTypes?: MisconceptionType[];
  choiceSignals?: PublicChoiceSignals;
  skipReason?: SkipReason;
}

export interface AnnotationSubmission {
  schemaVersion: 1;
  manifestVersion: 1;
  submissionId: typeof ANNOTATION_SUBMISSION_ID;
  generatedAt: string;
  records: AnnotationSubmissionRecord[];
}

const SUBMISSION_FIELDS = new Set(['schemaVersion', 'manifestVersion', 'submissionId', 'generatedAt', 'records']);
const RECORD_FIELDS = new Set(['sourceId', 'status', 'relevance', 'role', 'recruitingStage', 'topicIds', 'followUpTypes', 'misconceptionTypes', 'choiceSignals', 'skipReason']);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function canonicalTimestamp(value: unknown): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) throw new Error('invalid_submission_generatedAt');
  const normalized = new Date(value).toISOString();
  if (normalized !== value) throw new Error('invalid_submission_generatedAt');
  return normalized;
}

function publicRecord(annotation: ManualAnnotation): AnnotationSubmissionRecord {
  if (annotation.status === 'pending') throw new Error('submission_incomplete');
  if (annotation.status === 'skipped') {
    return { sourceId: annotation.sourceId, status: 'skipped', skipReason: annotation.skipReason! };
  }
  if (annotation.relevance !== 'relevant') {
    return { sourceId: annotation.sourceId, status: 'completed', relevance: annotation.relevance };
  }
  return {
    sourceId: annotation.sourceId,
    status: 'completed',
    relevance: 'relevant',
    role: annotation.role,
    recruitingStage: annotation.recruitingStage,
    topicIds: [...(annotation.topicIds ?? [])],
    followUpTypes: [...(annotation.followUpTypes ?? [])],
    misconceptionTypes: [...(annotation.misconceptionTypes ?? [])],
    ...(annotation.choiceSignals ? {
      choiceSignals: {
        cognitiveLevel: annotation.choiceSignals.cognitiveLevel,
        distractorTypes: [...annotation.choiceSignals.distractorTypes],
        answerCueTypes: [...annotation.choiceSignals.answerCueTypes],
      },
    } : {}),
  };
}

function validateRecord(value: unknown, source: SourceManifestEntry, generatedAt: string): AnnotationSubmissionRecord {
  if (!isObject(value) || Object.keys(value).some((key) => !RECORD_FIELDS.has(key))) throw new Error('invalid_submission_record_shape');
  const annotation = validateAnnotation({ ...value, updatedAt: generatedAt }, source);
  if (annotation.status === 'pending') throw new Error('submission_incomplete');
  const normalized = publicRecord(annotation);
  if (!isDeepStrictEqual(normalized, value)) throw new Error('invalid_submission_record_normalization');
  return normalized;
}

export function buildAnnotationSubmission(
  manifest: SourceManifest,
  dataset: ManualAnnotationDataset,
  generatedAt: string,
): AnnotationSubmission {
  const timestamp = canonicalTimestamp(generatedAt);
  const normalized = validateDataset(dataset, manifest);
  if (Object.keys(normalized.annotations).length !== manifest.sources.length) throw new Error('submission_incomplete');
  const records = manifest.sources.map((source) => {
    const annotation = normalized.annotations[source.sourceId];
    if (!annotation || annotation.status === 'pending') throw new Error('submission_incomplete');
    return publicRecord(annotation);
  });
  return validateAnnotationSubmission({
    schemaVersion: 1,
    manifestVersion: manifest.manifestVersion,
    submissionId: ANNOTATION_SUBMISSION_ID,
    generatedAt: timestamp,
    records,
  }, manifest);
}

export function validateAnnotationSubmission(value: unknown, manifest: SourceManifest): AnnotationSubmission {
  if (!isObject(value) || Object.keys(value).some((key) => !SUBMISSION_FIELDS.has(key))) throw new Error('invalid_submission_shape');
  if (value.schemaVersion !== 1 || value.manifestVersion !== manifest.manifestVersion || value.submissionId !== ANNOTATION_SUBMISSION_ID) {
    throw new Error('invalid_submission_version');
  }
  const generatedAt = canonicalTimestamp(value.generatedAt);
  if (!Array.isArray(value.records) || value.records.length !== manifest.sources.length) throw new Error('submission_incomplete');
  const sourceMap = new Map(manifest.sources.map((source) => [source.sourceId, source]));
  const seen = new Set<string>();
  const records = value.records.map((record, index) => {
    if (!isObject(record) || typeof record.sourceId !== 'string') throw new Error('invalid_submission_record_shape');
    if (seen.has(record.sourceId)) throw new Error(`duplicate_submission_source:${record.sourceId}`);
    seen.add(record.sourceId);
    const source = sourceMap.get(record.sourceId);
    if (!source) throw new Error(`unknown_submission_source:${record.sourceId}`);
    if (manifest.sources[index].sourceId !== record.sourceId) throw new Error(`invalid_submission_order:${record.sourceId}`);
    return validateRecord(record, source, generatedAt);
  });
  return {
    schemaVersion: 1,
    manifestVersion: 1,
    submissionId: ANNOTATION_SUBMISSION_ID,
    generatedAt,
    records,
  };
}

export function serializeAnnotationSubmission(submission: AnnotationSubmission): string {
  return `${JSON.stringify(submission, null, 2)}\n`;
}
