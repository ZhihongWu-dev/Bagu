export const ANALYTICS_SCHEMA_VERSION = 1;

export type AnalyticsEventName =
  | 'app_opened'
  | 'session_started'
  | 'screen_viewed'
  | 'lesson_started'
  | 'lesson_completed'
  | 'exercise_answered'
  | 'exercise_retried'
  | 'review_added'
  | 'review_completed'
  | 'knowledge_opened'
  | 'knowledge_favorited'
  | 'resume_feature_opened'
  | 'project_feature_opened'
  | 'sound_toggled';

export type AnalyticsProperties = Record<string, string | number | boolean>;

export type AnalyticsEvent = {
  schema_version: typeof ANALYTICS_SCHEMA_VERSION;
  event_id: string;
  session_id: string;
  event_name: AnalyticsEventName;
  occurred_at: string;
  app_version: string;
  platform: 'android' | 'ios' | 'web';
  properties: AnalyticsProperties;
};

type PropertyRule = {
  required?: boolean;
  validate: (value: unknown) => value is string | number | boolean;
};

const internalId = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9._:-]{1,100}$/.test(value);
const shortId = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9._:/-]{1,80}$/.test(value);
const booleanValue = (value: unknown): value is boolean => typeof value === 'boolean';
const duration = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 3_600_000;
const attempt = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 20;
const reviewSource = (value: unknown): value is string => value === 'lesson' || value === 'knowledge' || value === 'project';
const exerciseType = (value: unknown): value is string => value === 'single-choice' || value === 'multiple-choice' || value === 'ordering' || value === 'self-recall';

const required = (validate: PropertyRule['validate']): PropertyRule => ({ required: true, validate });

const eventRules: Record<AnalyticsEventName, Record<string, PropertyRule>> = {
  app_opened: {},
  session_started: {},
  screen_viewed: { screen_id: required(shortId) },
  lesson_started: { lesson_id: required(internalId) },
  lesson_completed: { lesson_id: required(internalId), duration_ms: required(duration) },
  exercise_answered: {
    lesson_id: required(internalId),
    exercise_id: required(internalId),
    exercise_type: required(exerciseType),
    correct: required(booleanValue),
    attempt_number: required(attempt),
    duration_ms: required(duration),
  },
  exercise_retried: { lesson_id: required(internalId), exercise_id: required(internalId) },
  review_added: { target_id: required(internalId), review_source: required(reviewSource) },
  review_completed: { target_id: required(internalId), review_source: required(reviewSource) },
  knowledge_opened: { knowledge_id: required(internalId) },
  knowledge_favorited: { knowledge_id: required(internalId), favorited: required(booleanValue) },
  resume_feature_opened: {},
  project_feature_opened: {},
  sound_toggled: { enabled: required(booleanValue) },
};

export function sanitizeEventProperties(eventName: AnalyticsEventName, input: unknown): AnalyticsProperties | null {
  if (!isRecord(input)) return null;
  const rules = eventRules[eventName];
  const inputKeys = Object.keys(input);
  if (inputKeys.some((key) => !(key in rules))) return null;

  const sanitized: AnalyticsProperties = {};
  for (const [key, rule] of Object.entries(rules)) {
    const value = input[key];
    if (value === undefined) {
      if (rule.required) return null;
      continue;
    }
    if (!rule.validate(value)) return null;
    sanitized[key] = value;
  }
  return sanitized;
}

export function createAnalyticsEvent(
  eventName: AnalyticsEventName,
  properties: unknown,
  context: Omit<AnalyticsEvent, 'schema_version' | 'event_name' | 'properties'>,
): AnalyticsEvent | null {
  const sanitized = sanitizeEventProperties(eventName, properties);
  if (!sanitized) return null;
  if (!isUuidLike(context.event_id) || !isUuidLike(context.session_id)) return null;
  if (!isIsoDate(context.occurred_at)) return null;
  if (!/^[A-Za-z0-9._-]{1,30}$/.test(context.app_version)) return null;
  if (!['android', 'ios', 'web'].includes(context.platform)) return null;

  return {
    schema_version: ANALYTICS_SCHEMA_VERSION,
    event_id: context.event_id,
    session_id: context.session_id,
    event_name: eventName,
    occurred_at: context.occurred_at,
    app_version: context.app_version,
    platform: context.platform,
    properties: sanitized,
  };
}

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === 'string' && value in eventRules;
}

function isUuidLike(value: string) {
  return /^[a-f0-9-]{20,64}$/i.test(value);
}

function isIsoDate(value: string) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) && value.length <= 30;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
