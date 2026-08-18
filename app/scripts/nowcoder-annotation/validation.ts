import type { SourceManifest, SourceManifestEntry } from '../nowcoder-intake/types';
import { ANSWER_CUE_TYPES, COGNITIVE_LEVELS, DISTRACTOR_TYPES, FOLLOW_UP_TYPES, MISCONCEPTION_TYPES, RECRUITING_STAGES, RELEVANCES, ROLES, SKIP_REASONS, TOPIC_IDS } from './taxonomy';
import type { AnswerCueType, AnnotationStatus, ChoiceSignals, CognitiveLevel, DistractorType, FollowUpType, ManualAnnotation, ManualAnnotationDataset, MisconceptionType, RecruitingStage, Relevance, Role, SkipReason } from './types';

const ANNOTATION_FIELDS = new Set(['sourceId', 'status', 'relevance', 'role', 'recruitingStage', 'topicIds', 'followUpTypes', 'misconceptionTypes', 'choiceSignals', 'summary', 'skipReason', 'skipNote', 'updatedAt']);
const CHOICE_FIELDS = new Set(['cognitiveLevel', 'distractorTypes', 'answerCueTypes']);
const PII_PATTERNS = [
  /\b1[3-9]\d{9}\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /(?:微信|wechat|vx|v信)\s*[:：]?\s*[a-zA-Z][-_a-zA-Z0-9]{5,19}/i,
  /(?:QQ|扣扣)\s*[:：]?\s*[1-9]\d{4,11}/i,
];

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringEnum<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) throw new Error(`invalid_${field}`);
  return value as T;
}

function normalizedArray<T extends string>(value: unknown, allowed: readonly T[], field: string): T[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !allowed.includes(item as T))) throw new Error(`invalid_${field}`);
  const values = new Set(value as T[]);
  return allowed.filter((item) => values.has(item));
}

function shortText(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new Error(`invalid_${field}`);
  const text = value.trim();
  if (!text) return undefined;
  if (Array.from(text).length > 100) throw new Error(`${field}_too_long`);
  if (PII_PATTERNS.some((pattern) => pattern.test(text))) throw new Error(`${field}_contains_pii`);
  return text;
}

function validateChoiceSignals(value: unknown): ChoiceSignals | undefined {
  if (value === undefined) return undefined;
  if (!isObject(value) || Object.keys(value).some((key) => !CHOICE_FIELDS.has(key))) throw new Error('invalid_choiceSignals');
  return {
    cognitiveLevel: stringEnum<CognitiveLevel>(value.cognitiveLevel, COGNITIVE_LEVELS, 'cognitiveLevel'),
    distractorTypes: normalizedArray<DistractorType>(value.distractorTypes, DISTRACTOR_TYPES, 'distractorTypes'),
    answerCueTypes: normalizedArray<AnswerCueType>(value.answerCueTypes, ANSWER_CUE_TYPES, 'answerCueTypes'),
  };
}

function hasSignalFields(annotation: ManualAnnotation): boolean {
  return Boolean(annotation.role || annotation.recruitingStage || annotation.topicIds?.length || annotation.followUpTypes?.length || annotation.misconceptionTypes?.length || annotation.choiceSignals);
}

export function containsAnnotationPii(text: string): boolean {
  return PII_PATTERNS.some((pattern) => pattern.test(text));
}

export function validateAnnotation(value: unknown, source: SourceManifestEntry): ManualAnnotation {
  if (!isObject(value) || Object.keys(value).some((key) => !ANNOTATION_FIELDS.has(key))) throw new Error('invalid_annotation_shape');
  if (value.sourceId !== source.sourceId) throw new Error('source_id_mismatch');
  const status = stringEnum<AnnotationStatus>(value.status, ['pending', 'completed', 'skipped'], 'status');
  if (typeof value.updatedAt !== 'string' || Number.isNaN(Date.parse(value.updatedAt))) throw new Error('invalid_updatedAt');
  const choiceSignals = validateChoiceSignals(value.choiceSignals);
  const summary = shortText(value.summary, 'summary');
  const skipNote = shortText(value.skipNote, 'skipNote');
  const annotation: ManualAnnotation = {
    sourceId: source.sourceId,
    status,
    ...(value.relevance !== undefined ? { relevance: stringEnum<Relevance>(value.relevance, RELEVANCES, 'relevance') } : {}),
    ...(value.role !== undefined ? { role: stringEnum<Role>(value.role, ROLES, 'role') } : {}),
    ...(value.recruitingStage !== undefined ? { recruitingStage: stringEnum<RecruitingStage>(value.recruitingStage, RECRUITING_STAGES, 'recruitingStage') } : {}),
    topicIds: normalizedArray(value.topicIds, TOPIC_IDS, 'topicIds'),
    followUpTypes: normalizedArray<FollowUpType>(value.followUpTypes, FOLLOW_UP_TYPES, 'followUpTypes'),
    misconceptionTypes: normalizedArray<MisconceptionType>(value.misconceptionTypes, MISCONCEPTION_TYPES, 'misconceptionTypes'),
    ...(choiceSignals ? { choiceSignals } : {}),
    ...(summary ? { summary } : {}),
    ...(value.skipReason !== undefined ? { skipReason: stringEnum<SkipReason>(value.skipReason, SKIP_REASONS, 'skipReason') } : {}),
    ...(skipNote ? { skipNote } : {}),
    updatedAt: new Date(value.updatedAt).toISOString(),
  };

  if (status === 'pending') {
    if (annotation.relevance || annotation.skipReason || hasSignalFields(annotation)) throw new Error('pending_must_not_contain_decision');
    return annotation;
  }
  if (status === 'skipped') {
    if (!annotation.skipReason) throw new Error('skipped_requires_reason');
    if (annotation.relevance || hasSignalFields(annotation)) throw new Error('skipped_must_not_contain_labels');
    return annotation;
  }
  if (!annotation.relevance) throw new Error('completed_requires_relevance');
  if (annotation.skipReason || annotation.skipNote) throw new Error('completed_must_not_contain_skip_fields');
  if (annotation.relevance !== 'relevant') {
    if (hasSignalFields(annotation)) throw new Error('non_relevant_must_not_contain_labels');
    return annotation;
  }
  if (!annotation.role || annotation.role === 'unknown') throw new Error('relevant_requires_role');
  if (!annotation.recruitingStage) throw new Error('relevant_requires_recruiting_stage');
  if (!annotation.topicIds?.length) throw new Error('relevant_requires_topic');
  if (source.pageType === 'multiple-choice' && !annotation.choiceSignals) throw new Error('relevant_choice_requires_cognitive_level');
  if (source.pageType !== 'multiple-choice' && annotation.choiceSignals) throw new Error('interview_must_not_contain_choice_signals');
  return annotation;
}

export function emptyDataset(manifest: SourceManifest): ManualAnnotationDataset {
  return { schemaVersion: 1, manifestVersion: manifest.manifestVersion, annotations: {} };
}

export function validateDataset(value: unknown, manifest: SourceManifest): ManualAnnotationDataset {
  if (!isObject(value) || Object.keys(value).some((key) => !['schemaVersion', 'manifestVersion', 'annotations'].includes(key))) throw new Error('invalid_dataset_shape');
  if (value.schemaVersion !== 1 || value.manifestVersion !== manifest.manifestVersion || !isObject(value.annotations)) throw new Error('invalid_dataset_version');
  const sources = new Map(manifest.sources.map((source) => [source.sourceId, source]));
  const annotations: Record<string, ManualAnnotation> = {};
  for (const [sourceId, annotation] of Object.entries(value.annotations)) {
    const source = sources.get(sourceId);
    if (!source) throw new Error(`unknown_annotation_source:${sourceId}`);
    annotations[sourceId] = validateAnnotation(annotation, source);
  }
  return { schemaVersion: 1, manifestVersion: 1, annotations };
}
