'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { aggregateEvents } = require('../aggregate');
const { validateBatch, validateEvent } = require('../protocol');

const baseEvent = {
  schema_version: 1,
  event_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  session_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  event_name: 'lesson_started',
  occurred_at: new Date().toISOString(),
  app_version: '1.0.0',
  platform: 'android',
  properties: { lesson_id: 'qkv-roles' },
};

test('validates exact event schema', () => {
  assert.ok(validateEvent(baseEvent));
  assert.equal(validateEvent({ ...baseEvent, resume_text: 'secret' }), null);
  assert.equal(validateEvent({ ...baseEvent, properties: { lesson_id: 'qkv-roles', answer: 'A' } }), null);
  assert.equal(validateBatch({ events: Array.from({ length: 21 }, () => baseEvent) }), null);
});

test('aggregates without exposing installation timelines', () => {
  const events = [
    { ...baseEvent, installation_id: 'install-a', event_name: 'app_opened', properties: {} },
    { ...baseEvent, installation_id: 'install-a', event_name: 'lesson_started', properties: { lesson_id: 'qkv-roles' } },
    { ...baseEvent, installation_id: 'install-a', event_name: 'exercise_answered', properties: { lesson_id: 'qkv-roles', exercise_id: 'q1', exercise_type: 'single-choice', correct: true, attempt_number: 1, duration_ms: 1000 } },
    { ...baseEvent, installation_id: 'install-a', event_name: 'lesson_completed', properties: { lesson_id: 'qkv-roles', duration_ms: 5000 } },
  ];
  const result = aggregateEvents(events);
  assert.equal(result.totals.anonymous_users, 1);
  assert.equal(result.funnel.lesson_completed, 1);
  assert.equal(result.lessons['qkv-roles'].completion_rate, 1);
  assert.equal(result.exercises.q1.first_correct_rate, 1);
  assert.equal(JSON.stringify(result).includes('install-a'), false);
});
