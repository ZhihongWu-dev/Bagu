import assert from 'node:assert/strict';

import { createAnalyticsEvent, sanitizeEventProperties } from '../src/analytics/protocol';
import { appendEvent, calculateRetry, normalizeAnalyticsState } from '../src/analytics/state';
import { emptyAnalyticsState, type AnalyticsState } from '../src/analytics/state';
import { AnalyticsRuntime } from '../src/analytics/runtime';
import type { AnalyticsTransportLike } from '../src/analytics/transport';

assert.deepEqual(sanitizeEventProperties('lesson_started', { lesson_id: 'qkv-roles' }), { lesson_id: 'qkv-roles' });
assert.equal(sanitizeEventProperties('lesson_started', { lesson_id: 'qkv-roles', resume_text: 'secret' }), null);
assert.equal(sanitizeEventProperties('knowledge_favorited', { knowledge_id: 'attention', favorited: 'yes' }), null);
assert.deepEqual(sanitizeEventProperties('exercise_answered', {
  lesson_id: 'qkv-roles',
  exercise_id: 'qkv-role-1',
  exercise_type: 'single-choice',
  correct: false,
  attempt_number: 1,
  duration_ms: 3_200,
}), {
  lesson_id: 'qkv-roles',
  exercise_id: 'qkv-role-1',
  exercise_type: 'single-choice',
  correct: false,
  attempt_number: 1,
  duration_ms: 3_200,
});
assert.equal(sanitizeEventProperties('exercise_answered', {
  lesson_id: 'qkv-roles', exercise_id: 'q1', exercise_type: 'single-choice', correct: true, attempt_number: 1, duration_ms: 4_000_000,
}), null);

const event = createAnalyticsEvent('screen_viewed', { screen_id: 'learning_path' }, {
  event_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  session_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  occurred_at: '2026-08-15T12:00:00.000Z',
  app_version: '1.0.0',
  platform: 'android',
});
assert.equal(event?.event_name, 'screen_viewed');
assert.equal(event?.properties.screen_id, 'learning_path');

let queue = [] as NonNullable<typeof event>[];
for (let index = 0; index < 501; index += 1) {
  const queuedEvent = createAnalyticsEvent('app_opened', {}, {
    event_id: `${Date.now().toString(16)}-${index.toString(16).padStart(8, '0')}-aaaaaaaa`,
    session_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    occurred_at: new Date().toISOString(),
    app_version: '1.0.0',
    platform: 'android',
  });
  if (queuedEvent) queue = appendEvent(queue, queuedEvent);
}
assert.equal(queue.length, 500);
assert.equal(queue[0].event_id.includes('00000000'), false);

assert.deepEqual(calculateRetry(0, 1_000, () => 0), { attempt: 1, next_attempt_at: new Date(3_000).toISOString() });
const denied = normalizeAnalyticsState({
  consent: 'denied',
  identity: { installation_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', write_token: 'x'.repeat(32) },
  pending_deletion: { installation_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', write_token: 'y'.repeat(32) },
  queue,
});
assert.equal(denied.identity, null);
assert.equal(denied.queue.length, 0);
assert.ok(denied.pending_deletion);

async function testRuntimeConsentBoundary() {
let storedState: AnalyticsState = emptyAnalyticsState();
const transportCalls = { create: 0, upload: 0, delete: 0 };
const fakeTransport: AnalyticsTransportLike = {
  isConfigured: () => true,
  createIdentity: async () => {
    transportCalls.create += 1;
    return { kind: 'success', value: { installation_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', write_token: 'z'.repeat(32) } };
  },
  upload: async (_identity, events) => {
    transportCalls.upload += 1;
    return { kind: 'success', value: events.map((queued) => queued.event_id) };
  },
  deleteIdentity: async () => {
    transportCalls.delete += 1;
    return { kind: 'success', value: null };
  },
};
const runtime = new AnalyticsRuntime({
  transport: fakeTransport,
  loadState: async () => storedState,
  saveState: async (state) => { storedState = structuredClone(state); },
});
await runtime.initialize();
runtime.track('app_opened');
await runtime.flush();
assert.deepEqual(transportCalls, { create: 0, upload: 0, delete: 0 });
await runtime.deny();
runtime.track('app_opened');
await runtime.flush();
assert.deepEqual(transportCalls, { create: 0, upload: 0, delete: 0 });
await runtime.grant();
await runtime.flush();
assert.deepEqual(transportCalls, { create: 1, upload: 1, delete: 0 });
await runtime.deny();
await runtime.flush();
assert.equal(transportCalls.delete, 1);
assert.equal(storedState.pending_deletion, null);
}

testRuntimeConsentBoundary()
  .then(() => console.log('analytics protocol tests passed'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
