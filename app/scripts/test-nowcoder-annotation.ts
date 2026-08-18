import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { request } from 'node:http';
import { join, resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { loadManifest } from './nowcoder-intake/manifest';
import type { SourceManifestEntry } from './nowcoder-intake/types';
import { buildAnnotationReport, buildTopicSummary } from './nowcoder-annotation/aggregate';
import { annotationsToCsv, csvCell } from './nowcoder-annotation/csv';
import { exportAnnotations } from './nowcoder-annotation/export';
import { annotationProgress, nextPendingSourceId } from './nowcoder-annotation/progress';
import { AnnotationStore } from './nowcoder-annotation/store';
import { startAnnotationServer } from './nowcoder-annotation/server';
import { taxonomyPayload } from './nowcoder-annotation/taxonomy';
import type { ManualAnnotation, ManualAnnotationDataset } from './nowcoder-annotation/types';
import { containsAnnotationPii, emptyDataset, validateAnnotation, validateDataset } from './nowcoder-annotation/validation';

function expectThrow(fn: () => unknown, message: string): void {
  assert.throws(fn, message);
}

async function rawRequestStatus(url: string, headers: Record<string, string>): Promise<number> {
  return await new Promise<number>((resolveStatus, reject) => {
    const outgoing = request(url, { headers }, (response) => {
      response.resume();
      response.once('end', () => resolveStatus(response.statusCode ?? 0));
    });
    outgoing.once('error', reject);
    outgoing.end();
  });
}

function relevantAnnotation(sourceId: string, overrides: Partial<ManualAnnotation> = {}): ManualAnnotation {
  return {
    sourceId,
    status: 'completed',
    relevance: 'relevant',
    role: 'llm_application',
    recruitingStage: 'campus-autumn',
    topicIds: ['rag-retrieval-rerank'],
    followUpTypes: ['debugging'],
    misconceptionTypes: ['missing-condition'],
    updatedAt: '2026-08-18T08:00:00.000Z',
    ...overrides,
  };
}

async function testValidation(manifestPath: string): Promise<void> {
  const manifest = await loadManifest(manifestPath);
  assert.equal(manifest.sources.length, 59);
  assert.equal(new Set(manifest.sources.map((source) => source.sourceId)).size, 59);
  const interview = manifest.sources.find((source) => source.pageType === 'interview')!;
  const choice = manifest.sources.find((source) => source.pageType === 'multiple-choice')!;

  const valid = validateAnnotation(relevantAnnotation(interview.sourceId), interview);
  assert.deepEqual(valid.topicIds, ['rag-retrieval-rerank']);
  expectThrow(() => validateAnnotation({ ...relevantAnnotation(interview.sourceId), rawText: 'forbidden' }, interview), 'extra fields must fail');
  expectThrow(() => validateAnnotation(relevantAnnotation('unknown'), interview), 'source mismatch must fail');
  expectThrow(() => validateAnnotation({ ...relevantAnnotation(interview.sourceId), role: undefined }, interview), 'relevant role is required');
  expectThrow(() => validateAnnotation({ ...relevantAnnotation(interview.sourceId), topicIds: [] }, interview), 'relevant topic is required');
  expectThrow(() => validateAnnotation(relevantAnnotation(choice.sourceId), choice), 'relevant choice needs cognitive level');
  const choiceAnnotation = validateAnnotation(relevantAnnotation(choice.sourceId, {
    choiceSignals: { cognitiveLevel: 'application', distractorTypes: ['overlap'], answerCueTypes: ['length'] },
  }), choice);
  assert.equal(choiceAnnotation.choiceSignals?.cognitiveLevel, 'application');
  expectThrow(() => validateAnnotation({ ...relevantAnnotation(interview.sourceId), choiceSignals: choiceAnnotation.choiceSignals }, interview), 'interview cannot have choice signals');
  const unrelated = validateAnnotation({ sourceId: interview.sourceId, status: 'completed', relevance: 'not-relevant', updatedAt: valid.updatedAt }, interview);
  assert.equal(unrelated.role, undefined);
  expectThrow(() => validateAnnotation({ ...unrelated, topicIds: ['rag-retrieval-rerank'] }, interview), 'unrelated cannot carry labels');
  expectThrow(() => validateAnnotation({ sourceId: interview.sourceId, status: 'skipped', updatedAt: valid.updatedAt }, interview), 'skip reason is required');
  const skipped = validateAnnotation({ sourceId: interview.sourceId, status: 'skipped', skipReason: 'cannot-assess', skipNote: '页面信息不足', updatedAt: valid.updatedAt }, interview);
  assert.equal(skipped.skipReason, 'cannot-assess');
  expectThrow(() => validateAnnotation({ ...relevantAnnotation(interview.sourceId), summary: '好'.repeat(101) }, interview), '101 characters must fail');
  assert.equal(validateAnnotation({ ...relevantAnnotation(interview.sourceId), summary: '好'.repeat(100) }, interview).summary?.length, 100);
  for (const pii of ['13812345678', 'user@example.com', '微信: abcdef12', 'QQ: 123456']) {
    assert.equal(containsAnnotationPii(pii), true);
    expectThrow(() => validateAnnotation({ ...relevantAnnotation(interview.sourceId), summary: pii }, interview), `${pii} must fail`);
  }
  const normalized = validateAnnotation({ ...relevantAnnotation(interview.sourceId), topicIds: ['rag-retrieval-rerank', 'transformer-attention', 'rag-retrieval-rerank'] }, interview);
  assert.deepEqual(normalized.topicIds, ['transformer-attention', 'rag-retrieval-rerank']);
  expectThrow(() => validateDataset({ schemaVersion: 1, manifestVersion: 1, annotations: { missing: relevantAnnotation('missing') } }, manifest), 'unknown dataset source must fail');
}

async function testStoreAndProgress(manifestPath: string, root: string): Promise<ManualAnnotationDataset> {
  const manifest = await loadManifest(manifestPath);
  const path = join(root, 'annotations.json');
  const store = new AnnotationStore(path, manifest);
  assert.deepEqual(await store.load(), emptyDataset(manifest));
  const first = manifest.sources[0];
  const second = manifest.sources[1];
  await Promise.all([
    store.save(first, relevantAnnotation(first.sourceId)),
    store.save(second, { sourceId: second.sourceId, status: 'skipped', skipReason: 'cannot-assess', updatedAt: '2026-08-18T08:01:00.000Z' }),
  ]);
  const loaded = await store.load();
  assert.equal(Object.keys(loaded.annotations).length, 2);
  assert.equal(loaded.annotations[first.sourceId].status, 'completed');
  assert.equal(loaded.annotations[second.sourceId].status, 'skipped');
  const progress = annotationProgress(manifest.sources, loaded.annotations);
  assert.deepEqual(progress, { total: 59, completed: 1, pending: 57, skipped: 1, nextSourceId: manifest.sources[2].sourceId });
  assert.equal(nextPendingSourceId(manifest.sources, loaded.annotations, first.sourceId), manifest.sources[2].sourceId);

  await writeFile(path, '{broken json', 'utf8');
  await assert.rejects(() => store.load());
  await assert.rejects(() => store.save(first, relevantAnnotation(first.sourceId, { summary: '不应覆盖损坏文件' })));
  assert.equal(await readFile(path, 'utf8'), '{broken json');
  await writeFile(path, JSON.stringify(loaded), 'utf8');
  return loaded;
}

async function testExports(manifestPath: string, root: string, dataset: ManualAnnotationDataset): Promise<void> {
  const manifest = await loadManifest(manifestPath);
  const first = manifest.sources[0];
  const third = manifest.sources[2];
  dataset.annotations[third.sourceId] = { sourceId: third.sourceId, status: 'completed', relevance: 'uncertain', updatedAt: '2026-08-18T08:02:00.000Z' };
  const summary = buildTopicSummary(manifest, dataset, '2026-08-18T09:00:00.000Z');
  assert.equal(summary.contributingSources, 1);
  assert.equal(summary.byTopic['rag-retrieval-rerank'], 1);
  const report = buildAnnotationReport(manifest, dataset, '2026-08-18T09:00:00.000Z');
  assert.equal(report.total, 59);
  assert.equal(report.completed, 2);
  assert.equal(report.skipped, 1);
  assert.equal(report.uncertain, 1);
  const csv = annotationsToCsv(manifest, { ...dataset, annotations: { ...dataset.annotations, [first.sourceId]: { ...dataset.annotations[first.sourceId], summary: '=unsafe,"line"\nnext' } } });
  assert(csv.includes("'=unsafe"));
  assert(csv.includes('""line""'));
  assert.equal(csvCell('@formula'), '"\'@formula"');
  const directory = await exportAnnotations(join(root, 'exports'), manifest, dataset, new Date('2026-08-18T10:00:00.000Z'));
  for (const name of ['annotations.json', 'annotations.csv', 'topic-summary.json', 'annotation-report.json']) {
    assert((await readFile(join(directory, name), 'utf8')).length > 10, `${name} must exist`);
  }
  const exportedReport = JSON.parse(await readFile(join(directory, 'annotation-report.json'), 'utf8'));
  assert.equal(exportedReport.total, 59);
}

async function testBrowserState(root: string): Promise<void> {
  const script = await readFile(resolve('scripts/nowcoder-annotation/ui/state.js'), 'utf8');
  const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only' });
  dom.window.eval(script);
  const tools = (dom.window as unknown as { AnnotationState: unknown }).AnnotationState as {
    progress: (candidates: { sourceId: string }[], annotations: Record<string, ManualAnnotation>) => { total: number; completed: number; pending: number; skipped: number; nextSourceId?: string };
    nextPending: (candidates: { sourceId: string }[], annotations: Record<string, ManualAnnotation>, current: string) => string | undefined;
    filteredCandidates: (candidates: { sourceId: string }[], annotations: Record<string, ManualAnnotation>, filter: string) => { sourceId: string }[];
  };
  const candidates = [{ sourceId: 'a' }, { sourceId: 'b' }, { sourceId: 'c' }];
  const annotations = {
    a: relevantAnnotation('a'),
    b: { sourceId: 'b', status: 'skipped', skipReason: 'cannot-assess', updatedAt: '2026-08-18T08:00:00.000Z' } as ManualAnnotation,
  };
  assert.deepEqual(JSON.parse(JSON.stringify(tools.progress(candidates, annotations))), { total: 3, completed: 1, skipped: 1, pending: 1, nextSourceId: 'c' });
  assert.equal(tools.nextPending(candidates, annotations, 'a'), 'c');
  assert.deepEqual(tools.filteredCandidates(candidates, annotations, 'skipped').map((item) => item.sourceId), ['b']);
  const html = await readFile(resolve('scripts/nowcoder-annotation/ui/index.html'), 'utf8');
  assert(html.includes('rel="noopener noreferrer"'));
  assert(!html.includes('<iframe'));
  assert.equal((await readFile(resolve('scripts/nowcoder-annotation/ui/app.js'), 'utf8')).includes('.innerHTML'), false);
  await writeFile(join(root, 'state-test-ok'), 'ok');
}

async function testBrowserApp(): Promise<void> {
  const html = await readFile(resolve('scripts/nowcoder-annotation/ui/index.html'), 'utf8');
  const stateScript = await readFile(resolve('scripts/nowcoder-annotation/ui/state.js'), 'utf8');
  const appScript = await readFile(resolve('scripts/nowcoder-annotation/ui/app.js'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://127.0.0.1:4178/' });
  const candidates = [
    { sourceId: 'nc-ui-001', url: 'https://www.nowcoder.com/discuss/1', pageType: 'interview', approvalStatus: 'discovered', discoveryQuery: '<img src=x onerror=alert(1)>' },
    { sourceId: 'nc-ui-002', url: 'https://www.nowcoder.com/questionTerminal/2', pageType: 'multiple-choice', approvalStatus: 'discovered', discoveryQuery: 'RAG 选择题' },
  ];
  const annotations: Record<string, ManualAnnotation> = {};
  let savedPayload: ManualAnnotation | undefined;
  const response = (body: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
  Object.defineProperty(dom.window, 'fetch', { value: async (url: string, init?: RequestInit) => {
    if (url === '/api/bootstrap') return response({ candidates, annotations, progress: { total: 2, completed: 0, pending: 2, skipped: 0, nextSourceId: 'nc-ui-001' }, taxonomy: taxonomyPayload() });
    if (url.startsWith('/api/annotations/')) {
      savedPayload = JSON.parse(String(init?.body)) as ManualAnnotation;
      annotations[savedPayload.sourceId] = savedPayload;
      return response({ annotation: savedPayload, progress: { total: 2, completed: 1, pending: 1, skipped: 0, nextSourceId: 'nc-ui-002' } });
    }
    return response({ directory: 'manual-data/exports/test' }, 201);
  } });
  Object.defineProperty(dom.window, 'confirm', { value: () => true });
  dom.window.eval(stateScript);
  dom.window.eval(appScript);
  await new Promise((resolveWait) => setTimeout(resolveWait, 20));
  const document = dom.window.document;
  assert.equal(document.querySelectorAll('#source-query img').length, 0, 'candidate text must not execute as HTML');
  assert.equal(document.querySelector('#source-query')?.textContent, '<img src=x onerror=alert(1)>');
  assert.equal(document.querySelector('#metric-pending')?.textContent, '2');
  const relevance = document.querySelector<HTMLInputElement>('input[name="relevance"][value="relevant"]')!;
  relevance.checked = true;
  relevance.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  const role = document.querySelector<HTMLSelectElement>('#role-select')!;
  role.value = 'llm_application';
  role.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  const stage = document.querySelector<HTMLSelectElement>('#stage-select')!;
  stage.value = 'campus-autumn';
  stage.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  const topic = document.querySelector<HTMLInputElement>('#topic-options input[value="rag-retrieval-rerank"]')!;
  topic.checked = true;
  topic.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  document.querySelector<HTMLFormElement>('#annotation-form')!.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await new Promise((resolveWait) => setTimeout(resolveWait, 20));
  assert.equal(savedPayload?.sourceId, 'nc-ui-001');
  assert.deepEqual(savedPayload?.topicIds, ['rag-retrieval-rerank']);
  assert.equal(document.querySelector('#source-query')?.textContent, 'RAG 选择题');
  assert.equal(document.querySelector('#metric-completed')?.textContent, '1');
}

async function testServer(manifestPath: string, root: string): Promise<void> {
  const dataPath = join(root, 'server-data', 'annotations.json');
  const exportsPath = join(root, 'server-data', 'exports');
  const running = await startAnnotationServer({ manifestPath, dataPath, exportRoot: exportsPath, port: 0, now: () => new Date('2026-08-18T11:00:00.000Z') });
  try {
    const address = running.server.address();
    assert(address && typeof address !== 'string');
    assert.equal(address.address, '127.0.0.1');
    const bootstrapResponse = await fetch(`${running.url}/api/bootstrap`);
    assert.equal(bootstrapResponse.status, 200);
    assert.equal(bootstrapResponse.headers.get('x-frame-options'), 'DENY');
    assert(bootstrapResponse.headers.get('content-security-policy')?.includes("connect-src 'self'"));
    const bootstrap = await bootstrapResponse.json() as { candidates: SourceManifestEntry[]; annotations: Record<string, ManualAnnotation> };
    assert.equal(bootstrap.candidates.length, 59);
    assert.deepEqual(bootstrap.annotations, {});
    assert.equal(Object.hasOwn(bootstrap.candidates[0], 'discoveredAt'), false);
    assert.equal(await rawRequestStatus(`${running.url}/api/bootstrap`, { Host: 'evil.example' }), 403);
    assert.equal((await fetch(`${running.url}/api/bootstrap`, { method: 'DELETE', headers: { Origin: running.url } })).status, 405);
    const first = bootstrap.candidates.find((source) => source.pageType === 'interview')!;
    const savedResponse = await fetch(`${running.url}/api/annotations/${first.sourceId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Origin: running.url }, body: JSON.stringify(relevantAnnotation(first.sourceId)),
    });
    assert.equal(savedResponse.status, 200, await savedResponse.text());
    const invalidOrigin = await fetch(`${running.url}/api/annotations/${first.sourceId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' }, body: JSON.stringify(relevantAnnotation(first.sourceId)),
    });
    assert.equal(invalidOrigin.status, 403);
    const invalidType = await fetch(`${running.url}/api/annotations/${first.sourceId}`, {
      method: 'PUT', headers: { 'Content-Type': 'text/plain', Origin: running.url }, body: '{}',
    });
    assert.equal(invalidType.status, 400);
    const tooLarge = await fetch(`${running.url}/api/annotations/${first.sourceId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Origin: running.url }, body: JSON.stringify({ text: 'x'.repeat(40_000) }),
    });
    assert.equal(tooLarge.status, 413);
    assert.equal((await fetch(`${running.url}/package.json`)).status, 404);
    assert.equal((await fetch(`${running.url}/..%2Fpackage.json`)).status, 404);
    const exported = await fetch(`${running.url}/api/export`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: running.url }, body: '{}' });
    const exportedBody = await exported.text();
    assert.equal(exported.status, 201, exportedBody);
    const exportResult = JSON.parse(exportedBody) as { directory: string };
    assert((await readFile(join(exportResult.directory, 'annotations.json'), 'utf8')).includes(first.sourceId));
    const after = await fetch(`${running.url}/api/bootstrap`);
    const afterData = await after.json() as { annotations: Record<string, ManualAnnotation> };
    assert.equal(afterData.annotations[first.sourceId].status, 'completed');
  } finally {
    await running.close();
  }
}

async function main(): Promise<void> {
  const manifestPath = resolve('quality/nowcoder-intake/manifests/pilot-100.json');
  const root = resolve('.tmp-nowcoder-annotation-test');
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
  try {
    await testValidation(manifestPath);
    const dataset = await testStoreAndProgress(manifestPath, root);
    await testExports(manifestPath, root, dataset);
    await testBrowserState(root);
    await testBrowserApp();
    await testServer(manifestPath, root);
    console.log('Nowcoder manual annotation tests passed.');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
