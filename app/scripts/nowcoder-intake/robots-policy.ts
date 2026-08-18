import { parseRobotsTxt } from 'robotstxt-util';
import { INTAKE_USER_AGENT, MAX_ROBOTS_BYTES, REQUEST_TIMEOUT_MS } from './config';
import { SerialRateLimiter } from './rate-limiter';

export interface RobotsDecision {
  status: 'allowed' | 'disallowed' | 'unavailable';
  crawlDelayMs: number;
  reason?: string;
}

function patternMatches(path: string, rule: string): boolean {
  if (!rule) return false;
  const anchored = rule.endsWith('$');
  const source = rule.replace(/\$$/, '').split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${source}${anchored ? '$' : ''}`).test(path);
}

export function decideRobots(text: string, url: URL, userAgent = INTAKE_USER_AGENT): RobotsDecision {
  if (!/^\s*user-agent\s*:/im.test(text)) return { status: 'unavailable', crawlDelayMs: 0, reason: 'missing_user_agent' };
  const malformedLine = text.split(/\r?\n/).some((line) => {
    const trimmed = line.replace(/#.*$/, '').trim();
    return Boolean(trimmed) && !trimmed.includes(':');
  });
  if (malformedLine) return { status: 'unavailable', crawlDelayMs: 0, reason: 'malformed_line' };
  try {
    const robots = parseRobotsTxt(text);
    const productToken = userAgent.split('/')[0].toLowerCase();
    const exact = robots.groups.filter((group) => group.ua.some((ua) => ua.toLowerCase() === productToken));
    const groups = exact.length ? exact : robots.groups.filter((group) => group.ua.includes('*'));
    if (!groups.length) return { status: 'allowed', crawlDelayMs: 0 };
    const path = `${url.pathname}${url.search}`;
    const candidates: { allowed: boolean; length: number }[] = [];
    let crawlDelayMs = 0;
    for (const group of groups) {
      for (const rule of group.allows) if (patternMatches(path, rule)) candidates.push({ allowed: true, length: rule.length });
      for (const rule of group.disallows) if (patternMatches(path, rule)) candidates.push({ allowed: false, length: rule.length });
      const crawlDelayValue = Object.entries(group.customRules).find(([key]) => key.toLowerCase() === 'crawl-delay')?.[1];
      const delay = Number(crawlDelayValue);
      if (Number.isFinite(delay) && delay >= 0) crawlDelayMs = Math.max(crawlDelayMs, delay * 1000);
    }
    candidates.sort((a, b) => b.length - a.length || Number(b.allowed) - Number(a.allowed));
    return { status: candidates[0]?.allowed === false ? 'disallowed' : 'allowed', crawlDelayMs };
  } catch {
    return { status: 'unavailable', crawlDelayMs: 0, reason: 'parse_error' };
  }
}

async function responseTextLimited(response: Response, limit: number): Promise<string> {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > limit) throw new Error('response_too_large');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > limit) throw new Error('response_too_large');
  return new TextDecoder().decode(bytes);
}

export class RobotsPolicy {
  private readonly cache = new Map<string, Promise<{ text: string } | null>>();

  constructor(private readonly fetchFn: typeof fetch = fetch, private readonly limiter?: SerialRateLimiter) {}

  async check(url: URL, signal?: AbortSignal): Promise<RobotsDecision> {
    let pending = this.cache.get(url.origin);
    if (!pending) {
      pending = this.fetchRobots(url.origin, signal);
      this.cache.set(url.origin, pending);
    }
    const result = await pending;
    if (!result) return { status: 'unavailable', crawlDelayMs: 0, reason: 'robots_fetch_failed' };
    return decideRobots(result.text, url);
  }

  private async fetchRobots(origin: string, outerSignal?: AbortSignal): Promise<{ text: string } | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const abort = () => controller.abort(outerSignal?.reason);
    outerSignal?.addEventListener('abort', abort, { once: true });
    try {
      const request = () => this.fetchFn(`${origin}/robots.txt`, {
          redirect: 'error',
          signal: controller.signal,
          headers: { 'user-agent': INTAKE_USER_AGENT, accept: 'text/plain' },
        });
      const response = this.limiter ? await this.limiter.schedule(request, 0, controller.signal) : await request();
      if (!response.ok) return null;
      return { text: await responseTextLimited(response, MAX_ROBOTS_BYTES) };
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
      outerSignal?.removeEventListener('abort', abort);
    }
  }
}
