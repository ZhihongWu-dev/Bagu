import { createAnalyticsEvent, type AnalyticsEventName, type AnalyticsProperties } from '@/analytics/protocol';
import { loadAnalyticsState, saveAnalyticsState } from '@/analytics/analytics-storage';
import { appendEvent, calculateRetry, emptyAnalyticsState, pruneEventQueue, type AnalyticsConsent, type AnalyticsState } from '@/analytics/state';
import { AnalyticsTransport, type AnalyticsTransportLike } from '@/analytics/transport';

const BATCH_SIZE = 20;

export class AnalyticsRuntime {
  private state: AnalyticsState = emptyAnalyticsState();
  private sessionId: string | null = null;
  private initialized = false;
  private flushing: Promise<void> | null = null;
  private consentListeners = new Set<(consent: AnalyticsConsent) => void>();
  private readonly transport: AnalyticsTransportLike;
  private readonly loadState: () => Promise<AnalyticsState>;
  private readonly saveState: (state: AnalyticsState) => Promise<void>;
  private readonly appVersion: string;
  private readonly platform: 'android' | 'ios' | 'web';

  constructor(dependencies: {
    transport?: AnalyticsTransportLike;
    loadState?: () => Promise<AnalyticsState>;
    saveState?: (state: AnalyticsState) => Promise<void>;
    appVersion?: string;
    platform?: 'android' | 'ios' | 'web';
  } = {}) {
    this.transport = dependencies.transport ?? new AnalyticsTransport();
    this.loadState = dependencies.loadState ?? loadAnalyticsState;
    this.saveState = dependencies.saveState ?? saveAnalyticsState;
    this.appVersion = dependencies.appVersion ?? 'unknown';
    this.platform = dependencies.platform ?? 'web';
  }

  async initialize() {
    if (this.initialized) return;
    this.state = await this.loadState();
    this.initialized = true;
    this.emitConsent();
    if (this.state.pending_deletion) void this.flush();
    if (this.state.consent === 'granted') this.startSession();
  }

  subscribeConsent(listener: (consent: AnalyticsConsent) => void) {
    this.consentListeners.add(listener);
    listener(this.state.consent);
    return () => this.consentListeners.delete(listener);
  }

  getConsent() {
    return this.state.consent;
  }

  async grant() {
    if (!this.initialized) await this.initialize();
    if (this.state.consent === 'granted') return;
    this.state = { ...this.state, consent: 'granted', queue: [], retry: { attempt: 0, next_attempt_at: null } };
    await this.persist();
    this.emitConsent();
    this.startSession();
  }

  async deny() {
    if (!this.initialized) await this.initialize();
    const pendingDeletion = this.state.identity ?? this.state.pending_deletion;
    this.sessionId = null;
    this.state = {
      ...emptyAnalyticsState(),
      consent: 'denied',
      pending_deletion: pendingDeletion,
    };
    await this.persist();
    this.emitConsent();
    if (pendingDeletion) void this.flush();
  }

  track(eventName: AnalyticsEventName, properties: AnalyticsProperties = {}) {
    if (!this.initialized || this.state.consent !== 'granted' || !this.sessionId) return;
    const event = createAnalyticsEvent(eventName, properties, {
      event_id: randomId(),
      session_id: this.sessionId,
      occurred_at: new Date().toISOString(),
      app_version: this.appVersion,
      platform: this.platform,
    });
    if (!event) {
      if (__DEV__) console.warn(`Analytics event rejected: ${eventName}`);
      return;
    }
    this.state = { ...this.state, queue: appendEvent(this.state.queue, event) };
    void this.persist();
    if (this.state.queue.length >= BATCH_SIZE) void this.flush();
  }

  async flush() {
    if (this.flushing) return this.flushing;
    this.flushing = this.performAllFlushes().finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  private startSession() {
    this.sessionId = randomId();
    this.track('app_opened');
    this.track('session_started');
    void this.flush();
  }

  private async performAllFlushes() {
    await this.flushDeletion();
    await this.performFlush();
  }

  private async performFlush() {
    if (this.state.consent !== 'granted' || !this.transport.isConfigured()) return;
    this.state = { ...this.state, queue: pruneEventQueue(this.state.queue) };
    const retryAt = this.state.retry.next_attempt_at ? Date.parse(this.state.retry.next_attempt_at) : 0;
    if (retryAt > Date.now()) return;

    let identity = this.state.identity;
    if (!identity) {
      const identityResult = await this.transport.createIdentity();
      if (identityResult.kind === 'success') {
        identity = identityResult.value;
        this.state = { ...this.state, identity, retry: { attempt: 0, next_attempt_at: null } };
        await this.persist();
      } else if (identityResult.kind === 'rejected' || identityResult.kind === 'unauthorized') {
        return;
      } else {
        await this.scheduleRetry();
        return;
      }
    }

    const batch = this.state.queue.slice(0, BATCH_SIZE);
    if (batch.length === 0) return;
    const result = await this.transport.upload(identity, batch);
    if (result.kind === 'success') {
      const accepted = new Set(result.value);
      this.state = {
        ...this.state,
        queue: this.state.queue.filter((event) => !accepted.has(event.event_id)),
        retry: { attempt: 0, next_attempt_at: null },
      };
      await this.persist();
      if (this.state.queue.length > 0) void this.flush();
      return;
    }
    if (result.kind === 'unauthorized') {
      await this.scheduleRetry();
      return;
    }
    if (result.kind === 'rejected') {
      const rejectedIds = new Set(batch.map((event) => event.event_id));
      this.state = { ...this.state, queue: this.state.queue.filter((event) => !rejectedIds.has(event.event_id)) };
      await this.persist();
      return;
    }
    await this.scheduleRetry();
  }

  private async flushDeletion() {
    const pending = this.state.pending_deletion;
    if (!pending || !this.transport.isConfigured()) return;
    const result = await this.transport.deleteIdentity(pending);
    if (result.kind === 'success') {
      this.state = { ...this.state, pending_deletion: null };
      await this.persist();
    }
  }

  private async scheduleRetry() {
    this.state = { ...this.state, retry: calculateRetry(this.state.retry.attempt) };
    await this.persist();
  }

  private persist() {
    return this.saveState(this.state).catch(() => undefined);
  }

  private emitConsent() {
    this.consentListeners.forEach((listener) => listener(this.state.consent));
  }
}

function randomId() {
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  return `${Date.now().toString(16)}-${Array.from({ length: 8 }, hex).join('')}-${Array.from({ length: 8 }, hex).join('')}`;
}
