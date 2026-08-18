import type { AnalyticsEvent } from '@/analytics/protocol';
import type { AnalyticsIdentity } from '@/analytics/state';

export type TransportResult<T> =
  | { kind: 'success'; value: T }
  | { kind: 'unavailable' }
  | { kind: 'unauthorized' }
  | { kind: 'retryable' }
  | { kind: 'rejected' };

export type AnalyticsTransportLike = Pick<AnalyticsTransport, 'isConfigured' | 'createIdentity' | 'upload' | 'deleteIdentity'>;

export class AnalyticsTransport {
  private readonly baseUrl: string | null;

  constructor(baseUrl = process.env.EXPO_PUBLIC_ANALYTICS_BASE_URL) {
    this.baseUrl = baseUrl?.trim().replace(/\/$/, '') || null;
  }

  isConfigured() {
    return this.baseUrl !== null;
  }

  async createIdentity(): Promise<TransportResult<AnalyticsIdentity>> {
    const result = await this.request('/v1/installations', { method: 'POST', body: '{}' });
    if (result.kind !== 'success') return result;
    const value = result.value;
    if (!isRecord(value) || typeof value.installation_id !== 'string' || typeof value.write_token !== 'string') return { kind: 'rejected' };
    return { kind: 'success', value: { installation_id: value.installation_id, write_token: value.write_token } };
  }

  async upload(identity: AnalyticsIdentity, events: AnalyticsEvent[]): Promise<TransportResult<string[]>> {
    const result = await this.request('/v1/events', {
      method: 'POST',
      identity,
      body: JSON.stringify({ events }),
    });
    if (result.kind !== 'success') return result;
    const value = result.value;
    if (!isRecord(value) || !Array.isArray(value.accepted_event_ids)) return { kind: 'rejected' };
    return { kind: 'success', value: value.accepted_event_ids.filter((item): item is string => typeof item === 'string') };
  }

  async deleteIdentity(identity: AnalyticsIdentity): Promise<TransportResult<null>> {
    const result = await this.request('/v1/installations/current', { method: 'DELETE', identity });
    return result.kind === 'success' ? { kind: 'success', value: null } : result;
  }

  private async request(path: string, options: { method: 'POST' | 'DELETE'; body?: string; identity?: AnalyticsIdentity }): Promise<TransportResult<unknown>> {
    if (!this.baseUrl) return { kind: 'unavailable' };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          ...(options.identity ? {
            Authorization: `Bearer ${options.identity.write_token}`,
            'X-Bagu-Installation': options.identity.installation_id,
          } : {}),
        },
        body: options.body,
        signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) return { kind: 'unauthorized' };
      if (response.status === 429 || response.status >= 500) return { kind: 'retryable' };
      if (!response.ok) return { kind: 'rejected' };
      if (response.status === 204) return { kind: 'success', value: null };
      return { kind: 'success', value: await response.json() as unknown };
    } catch {
      return { kind: 'retryable' };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
