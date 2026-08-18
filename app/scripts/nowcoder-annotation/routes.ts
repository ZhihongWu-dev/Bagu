import { readFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import type { SourceManifest } from '../nowcoder-intake/types';
import { exportAnnotations } from './export';
import { annotationProgress } from './progress';
import { applySecurityHeaders, readJsonBody, validateRequestOrigin } from './security';
import { AnnotationStore } from './store';
import { ANNOTATION_SUBMISSION_REPOSITORY_PATH } from './submission';
import { writeAnnotationSubmission } from './submission-writer';
import { taxonomyPayload } from './taxonomy';
import type { AnnotationCandidate } from './types';

export interface RouteContext {
  manifest: SourceManifest;
  store: AnnotationStore;
  exportRoot: string;
  submissionPath: string;
  uiRoot: string;
  now?: () => Date;
}

const STATIC_FILES: Record<string, { file: string; contentType: string }> = {
  '/': { file: 'index.html', contentType: 'text/html; charset=utf-8' },
  '/styles.css': { file: 'styles.css', contentType: 'text/css; charset=utf-8' },
  '/state.js': { file: 'state.js', contentType: 'text/javascript; charset=utf-8' },
  '/app.js': { file: 'app.js', contentType: 'text/javascript; charset=utf-8' },
};

function send(response: ServerResponse, status: number, body: string, contentType = 'application/json; charset=utf-8'): void {
  applySecurityHeaders(response);
  response.writeHead(status, { 'Content-Type': contentType, 'Content-Length': Buffer.byteLength(body) });
  response.end(body);
}

function json(response: ServerResponse, status: number, value: unknown): void {
  send(response, status, JSON.stringify(value));
}

function candidates(manifest: SourceManifest): AnnotationCandidate[] {
  return manifest.sources.map(({ sourceId, url, pageType, approvalStatus, discoveryQuery, reviewNote }) => ({
    sourceId, url, pageType, approvalStatus, discoveryQuery, ...(reviewNote ? { reviewNote } : {}),
  }));
}

function errorStatus(message: string): number {
  if (message === 'request_too_large') return 413;
  if (message === 'invalid_host' || message === 'invalid_origin') return 403;
  if (message.startsWith('unknown_source')) return 404;
  return 400;
}

export function createRequestHandler(context: RouteContext) {
  const sourceMap = new Map(context.manifest.sources.map((source) => [source.sourceId, source]));
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    const method = request.method ?? 'GET';
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
    try {
      validateRequestOrigin(request, method !== 'GET' && method !== 'HEAD');
      if (method === 'GET' && STATIC_FILES[requestUrl.pathname]) {
        const asset = STATIC_FILES[requestUrl.pathname];
        send(response, 200, await readFile(join(context.uiRoot, asset.file), 'utf8'), asset.contentType);
        return;
      }
      if (method === 'GET' && requestUrl.pathname === '/api/bootstrap') {
        const dataset = await context.store.load();
        json(response, 200, { candidates: candidates(context.manifest), annotations: dataset.annotations, progress: annotationProgress(context.manifest.sources, dataset.annotations), taxonomy: taxonomyPayload() });
        return;
      }
      const annotationMatch = requestUrl.pathname.match(/^\/api\/annotations\/([a-z0-9-]+)$/);
      if (method === 'PUT' && annotationMatch) {
        const source = sourceMap.get(annotationMatch[1]);
        if (!source) throw new Error(`unknown_source:${annotationMatch[1]}`);
        const dataset = await context.store.save(source, await readJsonBody(request));
        json(response, 200, { annotation: dataset.annotations[source.sourceId], progress: annotationProgress(context.manifest.sources, dataset.annotations) });
        return;
      }
      if (method === 'POST' && requestUrl.pathname === '/api/export') {
        await readJsonBody(request);
        const dataset = await context.store.load();
        const directory = await exportAnnotations(context.exportRoot, context.manifest, dataset, (context.now ?? (() => new Date()))());
        json(response, 201, { directory });
        return;
      }
      if (method === 'POST' && requestUrl.pathname === '/api/submission') {
        await readJsonBody(request);
        const dataset = await context.store.load();
        await writeAnnotationSubmission(context.submissionPath, context.manifest, dataset, (context.now ?? (() => new Date()))());
        json(response, 201, {
          path: ANNOTATION_SUBMISSION_REPOSITORY_PATH,
          validationCommand: 'npm run annotation:validate-submission',
          gitCommands: [
            'git add app/quality/nowcoder-intake/submissions/pilot-100-v1.json',
            'git commit -m "data: submit pilot annotation signals"',
            'git push -u origin annotation/pilot-100-v1',
          ],
        });
        return;
      }
      if (['GET', 'HEAD', 'PUT', 'POST'].includes(method)) json(response, 404, { error: 'not_found' });
      else json(response, 405, { error: 'method_not_allowed' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unexpected_error';
      json(response, errorStatus(message), { error: message });
    }
  };
}
