import assert from 'node:assert/strict';
import { readFile, rm, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { aggregateSignals } from './nowcoder-intake/aggregate';
import { contentHash } from './nowcoder-intake/content-hash';
import { exportCandidatePackage, signalsToCsv } from './nowcoder-intake/export';
import { extractArticle } from './nowcoder-intake/extract-article';
import { extractSignals } from './nowcoder-intake/extract-signals';
import { SafePageFetcher } from './nowcoder-intake/fetch-page';
import { validateManifest, approvedQueue } from './nowcoder-intake/manifest';
import { manifestReviewCsv } from './nowcoder-intake/manifest-review';
import { classifyPage } from './nowcoder-intake/page-classifier';
import { SerialRateLimiter } from './nowcoder-intake/rate-limiter';
import { assertSafeOutput, containsPii, redactText } from './nowcoder-intake/redact';
import { decideRobots, RobotsPolicy } from './nowcoder-intake/robots-policy';
import { stopReason } from './nowcoder-intake/stop-policy';
import type { SourceManifestEntry } from './nowcoder-intake/types';
import { normalizeApprovedUrl } from './nowcoder-intake/url-policy';

function expectThrow(fn: () => unknown, message: string): void {
  let threw = false;
  try { fn(); } catch { threw = true; }
  assert.equal(threw, true, message);
}

const fixtureRoot = resolve('quality/nowcoder-intake/fixtures');
const source = (overrides: Partial<SourceManifestEntry> = {}): SourceManifestEntry => ({
  sourceId: 'nc-test-001', url: 'https://www.nowcoder.com/discuss/123', pageType: 'interview',
  approvalStatus: 'approved', discoveryQuery: 'site:nowcoder.com 大模型 面经', discoveredAt: '2026-08-17T00:00:00.000Z', ...overrides,
});

async function testUrlAndManifest(): Promise<void> {
  expectThrow(() => normalizeApprovedUrl('http://www.nowcoder.com/a'), 'HTTP must fail');
  expectThrow(() => normalizeApprovedUrl('https://example.com/a'), 'other host must fail');
  expectThrow(() => normalizeApprovedUrl('https://www.nowcoder.com/a?token=secret'), 'sensitive query must fail');
  expectThrow(() => normalizeApprovedUrl('https://www.nowcoder.com/a?name=user@example.com'), 'PII query values must fail');
  expectThrow(() => normalizeApprovedUrl('https://www.nowcoder.com/a/13812345678'), 'PII path must fail');
  expectThrow(() => normalizeApprovedUrl('https://user:pass@www.nowcoder.com/a'), 'credentials must fail');
  assert.equal(normalizeApprovedUrl('https://www.nowcoder.com/a?utm_source=x&b=2&a=1#part'), 'https://www.nowcoder.com/a?a=1&b=2');
  const manifest = validateManifest({ manifestVersion: 1, sources: [source({ approvalStatus: 'discovered' })] });
  assert.equal(approvedQueue(manifest).length, 0);
  assert(manifestReviewCsv(validateManifest({ manifestVersion: 1, sources: [source({ approvalStatus: 'discovered', discoveryQuery: '=unsafe' })] })).includes("'=unsafe"));
  expectThrow(() => validateManifest({ manifestVersion: 1, sources: [source(), source({ sourceId: 'nc-test-002' })] }), 'duplicate URL must fail');
  expectThrow(() => validateManifest({ manifestVersion: 1, sources: [{ ...source(), rawText: 'forbidden' }] }), 'unknown fields must fail');
  expectThrow(() => validateManifest({ manifestVersion: 1, sources: Array.from({ length: 101 }, (_, i) => source({ sourceId: `nc-${String(i).padStart(3, '0')}`, url: `https://www.nowcoder.com/discuss/${i}` })) }), '101 approved URLs must fail');
}

async function testRobotsAndRateLimit(): Promise<void> {
  assert.equal(decideRobots('User-agent: *\nDisallow: /private\nAllow: /private/public\nCrawl-delay: 15', new URL('https://www.nowcoder.com/private/public')).status, 'allowed');
  const blocked = decideRobots('User-agent: *\nDisallow: /private\nCrawl-delay: 15', new URL('https://www.nowcoder.com/private'));
  assert.equal(blocked.status, 'disallowed');
  assert.equal(blocked.crawlDelayMs, 15_000);
  assert.equal(decideRobots('this is not robots', new URL('https://www.nowcoder.com/a')).status, 'unavailable');
  assert.equal(decideRobots('User-agent: *\nmalformed', new URL('https://www.nowcoder.com/a')).status, 'unavailable');
  let now = 1_000;
  const waits: number[] = [];
  const limiter = new SerialRateLimiter(async (ms) => { waits.push(ms); now += ms; }, () => now, () => 0);
  await limiter.schedule(async () => 'first');
  await limiter.schedule(async () => 'second', 15_000);
  assert.deepEqual(waits, [15_000]);
  let active = 0;
  let maxActive = 0;
  const noWait = new SerialRateLimiter(async () => {}, () => now += 20_000, () => 0);
  await Promise.all([1, 2, 3].map(() => noWait.schedule(async () => { active += 1; maxActive = Math.max(maxActive, active); await Promise.resolve(); active -= 1; })));
  assert.equal(maxActive, 1, 'requests must be serialized');
}

async function testSafeFetcher(): Promise<void> {
  const requests: { url: string; headers: Headers }[] = [];
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    requests.push({ url, headers });
    if (url.endsWith('/robots.txt')) return new Response('User-agent: *\nAllow: /', { status: 200, headers: { 'content-type': 'text/plain' } });
    return new Response('<html><body><article>This is a sufficiently long public technical article about RAG, retrieval, reranking, latency, and evaluation.</article></body></html>', { status: 200, headers: { 'content-type': 'text/html' } });
  };
  let now = 1_000;
  const limiter = new SerialRateLimiter(async (ms) => { now += ms; }, () => now, () => 0);
  const fetcher = new SafePageFetcher(new RobotsPolicy(fakeFetch, limiter), limiter, fakeFetch);
  const result = await fetcher.fetch('https://www.nowcoder.com/discuss/123');
  assert.equal(result.ok, true);
  assert.equal(requests.filter((request) => request.url.endsWith('/robots.txt')).length, 1);
  assert(requests.every((request) => !request.headers.has('cookie') && !request.headers.has('authorization') && !request.headers.has('referer')));

  let pageRequested = false;
  const unavailableFetch: typeof fetch = async (input) => {
    if (String(input).endsWith('/robots.txt')) return new Response('missing', { status: 404 });
    pageRequested = true;
    return new Response('unexpected');
  };
  const unavailable = await new SafePageFetcher(new RobotsPolicy(unavailableFetch), limiter, unavailableFetch).fetch('https://www.nowcoder.com/discuss/124');
  assert.equal(unavailable.ok, false);
  assert.equal(unavailable.ok ? '' : unavailable.status, 'robots_unavailable');
  assert.equal(pageRequested, false, 'page must not be requested when robots is unavailable');

  const redirectFetch: typeof fetch = async (input) => String(input).endsWith('/robots.txt')
    ? new Response('User-agent: *\nAllow: /', { status: 200 })
    : new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/private' } });
  const redirected = await new SafePageFetcher(new RobotsPolicy(redirectFetch), limiter, redirectFetch).fetch('https://www.nowcoder.com/discuss/125');
  assert.equal(redirected.ok, false);
  assert.equal(redirected.ok ? '' : redirected.status, 'redirect_blocked');
}

async function testExtractionAndPrivacy(): Promise<void> {
  const interviewHtml = await readFile(join(fixtureRoot, 'interview-public.html'), 'utf8');
  const article = extractArticle(interviewHtml, source().url);
  assert(article && article.text.includes('RAG') && !article.text.includes('关于我们'));
  assert.equal(classifyPage(source().url, article.title, article.text, 'interview').ok, true);
  for (const name of ['login-required.html', 'captcha.html', 'paywalled.html']) {
    const blocked = extractArticle(await readFile(join(fixtureRoot, name), 'utf8'), source().url);
    const text = blocked?.text ?? (await readFile(join(fixtureRoot, name), 'utf8'));
    assert.equal(classifyPage(source().url, '', text, 'interview').ok, false, `${name} must be rejected`);
  }
  const piiHtml = await readFile(join(fixtureRoot, 'pii-heavy.html'), 'utf8');
  const piiArticle = extractArticle(piiHtml, source().url)!;
  const redacted = redactText(piiArticle.text);
  assert(redacted.redactions > 0 && !containsPii(redacted.text));
  assertSafeOutput({ safe: redacted.text });
  expectThrow(() => assertSafeOutput({ rawText: 'hidden' }), 'forbidden fields must fail');
  expectThrow(() => assertSafeOutput({ note: 'user@example.com' }), 'PII in output must fail');
  const duplicateA = extractArticle(await readFile(join(fixtureRoot, 'duplicate-a.html'), 'utf8'), source().url)!;
  const duplicateB = extractArticle(await readFile(join(fixtureRoot, 'duplicate-b.html'), 'utf8'), source().url)!;
  assert.equal(contentHash(duplicateA.text), contentHash(duplicateB.text));
}

async function testSignalsAndExports(): Promise<void> {
  const html = await readFile(join(fixtureRoot, 'interview-public.html'), 'utf8');
  const article = extractArticle(html, source().url)!;
  const signal = extractSignals(source(), source().url, `${article.title} ${article.text}`, '2026-08-17T01:00:00.000Z');
  assert(signal.topicIds.includes('rag-retrieval-rerank'));
  assert.equal(signal.role, 'llm_application');
  assert.equal(signal.recruitingStage, 'campus-autumn');
  assert(!JSON.stringify(signal).includes('讨论 RAG 检索'));
  const choice = extractSignals(source({ sourceId: 'nc-test-002', pageType: 'multiple-choice' }), source().url, 'Transformer KV Cache 选择题，必须注意边界条件与格式线索。');
  assert(choice.choiceSignals && choice.choiceSignals.distractorTypes.includes('absolute-claim'));
  const csv = signalsToCsv([{ ...signal, sourceId: '=unsafe' }]);
  assert(csv.includes("'=unsafe"));
  const summary = aggregateSignals([signal, { ...signal, sourceId: 'duplicate' }]);
  assert.equal(summary.sourceCount, 2);
  assert.equal(summary.uniqueContentCount, 1);
  const output = resolve('.tmp-nowcoder-intake-test');
  await rm(output, { recursive: true, force: true });
  await mkdir(output);
  const report = { schemaVersion: 1 as const, startedAt: signal.collectedAt, finishedAt: signal.collectedAt, requested: 1, processed: 1, succeeded: 1, rejected: 0, duplicateCount: 0, statusCounts: { success: 1 } };
  await exportCandidatePackage(output, [signal], [], report);
  assert((await readFile(join(output, 'source-signals.jsonl'), 'utf8')).includes(signal.sourceId));
  await rm(output, { recursive: true, force: true });
}

function testStopPolicy(): void {
  assert.equal(stopReason(Array(10).fill('robots_disallowed'), 100), 'ten_consecutive_access_controls');
  assert.equal(stopReason([...Array(11).fill('network_error'), ...Array(9).fill('success')], 100), 'recent_failure_rate_above_50_percent');
  assert.equal(stopReason(Array(5).fill('success'), 5), 'page_limit_reached');
  assert.equal(stopReason(Array(9).fill('robots_disallowed'), 100), undefined);
}

async function main(): Promise<void> {
  await testUrlAndManifest();
  await testRobotsAndRateLimit();
  await testSafeFetcher();
  await testExtractionAndPrivacy();
  await testSignalsAndExports();
  testStopPolicy();
  console.log('Nowcoder intake tests passed.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
