import { INTAKE_USER_AGENT, MAX_HTML_BYTES, MAX_REDIRECTS, REQUEST_TIMEOUT_MS } from './config';
import { SerialRateLimiter } from './rate-limiter';
import { RobotsPolicy } from './robots-policy';
import type { IntakeStatus } from './types';
import { normalizeApprovedUrl } from './url-policy';

export type FetchResult = { ok: true; finalUrl: string; html: string } | { ok: false; status: IntakeStatus; reason: string };

async function readHtml(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) throw new Error('unsupported_content_type');
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_HTML_BYTES) throw new Error('response_too_large');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_HTML_BYTES) throw new Error('response_too_large');
  return new TextDecoder().decode(bytes);
}

export class SafePageFetcher {
  constructor(
    private readonly robots: RobotsPolicy,
    private readonly limiter: SerialRateLimiter,
    private readonly fetchFn: typeof fetch = fetch,
    private readonly normalizeUrl: (url: string) => string = normalizeApprovedUrl,
  ) {}

  async fetch(rawUrl: string, signal?: AbortSignal): Promise<FetchResult> {
    let current: string;
    try { current = this.normalizeUrl(rawUrl); } catch (error) {
      return { ok: false, status: 'redirect_blocked', reason: String(error) };
    }
    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
      const url = new URL(current);
      const decision = await this.robots.check(url, signal);
      if (decision.status === 'unavailable') return { ok: false, status: 'robots_unavailable', reason: decision.reason ?? 'robots unavailable' };
      if (decision.status === 'disallowed') return { ok: false, status: 'robots_disallowed', reason: 'robots disallowed path' };
      try {
        let response: Response | undefined;
        let lastError: unknown;
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            response = await this.limiter.schedule(() => this.request(url, signal), decision.crawlDelayMs, signal);
            if (response.status < 500 || attempt === 1) break;
            await response.body?.cancel();
          } catch (error) {
            lastError = error;
            if (attempt === 1) throw error;
          }
        }
        if (!response) throw lastError ?? new Error('request_failed');
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (!location) return { ok: false, status: 'network_error', reason: 'redirect_without_location' };
          try { current = this.normalizeUrl(new URL(location, url).toString()); } catch (error) {
            return { ok: false, status: 'redirect_blocked', reason: String(error) };
          }
          continue;
        }
        if (!response.ok) return { ok: false, status: 'network_error', reason: `http_${response.status}` };
        return { ok: true, finalUrl: current, html: await readHtml(response) };
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return { ok: false, status: reason.includes('unsupported_content_type') ? 'unsupported_page' : 'network_error', reason };
      }
    }
    return { ok: false, status: 'redirect_blocked', reason: 'too_many_redirects' };
  }

  private async request(url: URL, outerSignal?: AbortSignal): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error('request_timeout')), REQUEST_TIMEOUT_MS);
    const abort = () => controller.abort(outerSignal?.reason);
    outerSignal?.addEventListener('abort', abort, { once: true });
    try {
      return await this.fetchFn(url, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'user-agent': INTAKE_USER_AGENT, accept: 'text/html,application/xhtml+xml' },
      });
    } finally {
      clearTimeout(timeout);
      outerSignal?.removeEventListener('abort', abort);
    }
  }
}
