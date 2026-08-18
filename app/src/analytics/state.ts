import { createAnalyticsEvent, isAnalyticsEventName, type AnalyticsEvent } from '@/analytics/protocol';

export const MAX_QUEUE_SIZE = 500;
export const MAX_EVENT_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type AnalyticsConsent = 'unknown' | 'granted' | 'denied';

export type AnalyticsIdentity = {
  installation_id: string;
  write_token: string;
};

export type AnalyticsRetry = {
  attempt: number;
  next_attempt_at: string | null;
};

export type AnalyticsState = {
  consent: AnalyticsConsent;
  identity: AnalyticsIdentity | null;
  pending_deletion: AnalyticsIdentity | null;
  queue: AnalyticsEvent[];
  retry: AnalyticsRetry;
};

export const emptyAnalyticsState = (): AnalyticsState => ({
  consent: 'unknown',
  identity: null,
  pending_deletion: null,
  queue: [],
  retry: { attempt: 0, next_attempt_at: null },
});

export function normalizeAnalyticsState(value: unknown, now = Date.now()): AnalyticsState {
  if (!isRecord(value)) return emptyAnalyticsState();
  const consent: AnalyticsConsent = value.consent === 'granted' || value.consent === 'denied' ? value.consent : 'unknown';
  const identity = normalizeIdentity(value.identity);
  const pendingDeletion = normalizeIdentity(value.pending_deletion);
  const queue = Array.isArray(value.queue)
    ? pruneEventQueue(value.queue.flatMap((event) => {
        const normalized = normalizeEvent(event);
        return normalized ? [normalized] : [];
      }), now)
    : [];
  const retryValue = isRecord(value.retry) ? value.retry : {};
  const attempt = typeof retryValue.attempt === 'number' && Number.isFinite(retryValue.attempt)
    ? Math.max(0, Math.min(10, Math.floor(retryValue.attempt)))
    : 0;
  const nextAttemptAt = typeof retryValue.next_attempt_at === 'string' && Number.isFinite(Date.parse(retryValue.next_attempt_at))
    ? retryValue.next_attempt_at
    : null;

  return {
    consent,
    identity: consent === 'granted' ? identity : null,
    pending_deletion: pendingDeletion,
    queue: consent === 'granted' ? queue : [],
    retry: consent === 'granted' ? { attempt, next_attempt_at: nextAttemptAt } : { attempt: 0, next_attempt_at: null },
  };
}

export function appendEvent(queue: AnalyticsEvent[], event: AnalyticsEvent, now = Date.now()) {
  return pruneEventQueue([...queue, event], now);
}

export function pruneEventQueue(queue: AnalyticsEvent[], now = Date.now()) {
  const cutoff = now - MAX_EVENT_AGE_MS;
  return queue
    .filter((event) => Date.parse(event.occurred_at) >= cutoff && Date.parse(event.occurred_at) <= now + 24 * 60 * 60 * 1000)
    .slice(-MAX_QUEUE_SIZE);
}

export function calculateRetry(attempt: number, now = Date.now(), random = Math.random): AnalyticsRetry {
  const nextAttempt = Math.min(10, Math.max(1, attempt + 1));
  const baseDelay = Math.min(30 * 60 * 1000, 2 ** (nextAttempt - 1) * 2_000);
  const jitter = Math.floor(baseDelay * 0.25 * random());
  return { attempt: nextAttempt, next_attempt_at: new Date(now + baseDelay + jitter).toISOString() };
}

function normalizeEvent(value: unknown): AnalyticsEvent | null {
  if (!isRecord(value) || !isAnalyticsEventName(value.event_name)) return null;
  if (typeof value.event_id !== 'string' || typeof value.session_id !== 'string' || typeof value.occurred_at !== 'string') return null;
  if (typeof value.app_version !== 'string') return null;
  if (value.platform !== 'android' && value.platform !== 'ios' && value.platform !== 'web') return null;
  return createAnalyticsEvent(value.event_name, value.properties, {
    event_id: value.event_id,
    session_id: value.session_id,
    occurred_at: value.occurred_at,
    app_version: value.app_version,
    platform: value.platform,
  });
}

function normalizeIdentity(value: unknown): AnalyticsIdentity | null {
  if (!isRecord(value)) return null;
  if (typeof value.installation_id !== 'string' || !/^[a-f0-9-]{20,64}$/i.test(value.installation_id)) return null;
  if (typeof value.write_token !== 'string' || value.write_token.length < 24 || value.write_token.length > 256) return null;
  return { installation_id: value.installation_id, write_token: value.write_token };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
