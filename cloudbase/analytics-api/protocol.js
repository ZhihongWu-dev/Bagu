'use strict';

const SCHEMA_VERSION = 1;
const EVENT_NAMES = new Set([
  'app_opened', 'session_started', 'screen_viewed', 'lesson_started', 'lesson_completed',
  'exercise_answered', 'exercise_retried', 'review_added', 'review_completed',
  'knowledge_opened', 'knowledge_favorited', 'resume_feature_opened',
  'project_feature_opened', 'sound_toggled',
]);

const internalId = (value) => typeof value === 'string' && /^[A-Za-z0-9._:-]{1,100}$/.test(value);
const shortId = (value) => typeof value === 'string' && /^[A-Za-z0-9._:/-]{1,80}$/.test(value);
const bool = (value) => typeof value === 'boolean';
const duration = (value) => Number.isInteger(value) && value >= 0 && value <= 3_600_000;
const attempt = (value) => Number.isInteger(value) && value >= 1 && value <= 20;
const reviewSource = (value) => ['lesson', 'knowledge', 'project'].includes(value);
const exerciseType = (value) => ['single-choice', 'multiple-choice', 'ordering', 'self-recall'].includes(value);

const rules = {
  app_opened: {},
  session_started: {},
  screen_viewed: { screen_id: shortId },
  lesson_started: { lesson_id: internalId },
  lesson_completed: { lesson_id: internalId, duration_ms: duration },
  exercise_answered: { lesson_id: internalId, exercise_id: internalId, exercise_type: exerciseType, correct: bool, attempt_number: attempt, duration_ms: duration },
  exercise_retried: { lesson_id: internalId, exercise_id: internalId },
  review_added: { target_id: internalId, review_source: reviewSource },
  review_completed: { target_id: internalId, review_source: reviewSource },
  knowledge_opened: { knowledge_id: internalId },
  knowledge_favorited: { knowledge_id: internalId, favorited: bool },
  resume_feature_opened: {},
  project_feature_opened: {},
  sound_toggled: { enabled: bool },
};

function validateEvent(value, now = Date.now()) {
  if (!isObject(value) || !hasExactKeys(value, ['schema_version', 'event_id', 'session_id', 'event_name', 'occurred_at', 'app_version', 'platform', 'properties'])) return null;
  if (value.schema_version !== SCHEMA_VERSION || !EVENT_NAMES.has(value.event_name)) return null;
  if (!uuidLike(value.event_id) || !uuidLike(value.session_id)) return null;
  if (!['android', 'ios', 'web'].includes(value.platform)) return null;
  if (typeof value.app_version !== 'string' || !/^[A-Za-z0-9._-]{1,30}$/.test(value.app_version)) return null;
  const occurredAt = Date.parse(value.occurred_at);
  if (!Number.isFinite(occurredAt) || value.occurred_at.length > 30) return null;
  if (occurredAt < now - 8 * 24 * 60 * 60 * 1000 || occurredAt > now + 24 * 60 * 60 * 1000) return null;
  if (!isObject(value.properties)) return null;
  const propertyRules = rules[value.event_name];
  if (!hasExactKeys(value.properties, Object.keys(propertyRules))) return null;
  for (const [key, validate] of Object.entries(propertyRules)) {
    if (!validate(value.properties[key])) return null;
  }
  return {
    schema_version: SCHEMA_VERSION,
    event_id: value.event_id,
    session_id: value.session_id,
    event_name: value.event_name,
    occurred_at: new Date(occurredAt).toISOString(),
    app_version: value.app_version,
    platform: value.platform,
    properties: { ...value.properties },
  };
}

function validateBatch(value, now = Date.now()) {
  if (!isObject(value) || !hasExactKeys(value, ['events']) || !Array.isArray(value.events) || value.events.length < 1 || value.events.length > 20) return null;
  const events = value.events.map((event) => validateEvent(event, now));
  return events.every(Boolean) ? events : null;
}

function hasExactKeys(value, expected) {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length && actual.every((key, index) => key === sortedExpected[index]);
}

function uuidLike(value) {
  return typeof value === 'string' && /^[a-f0-9-]{20,64}$/i.test(value);
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

module.exports = { SCHEMA_VERSION, validateBatch, validateEvent };
