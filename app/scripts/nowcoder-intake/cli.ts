import { readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractArticle } from './extract-article';
import { extractSignals } from './extract-signals';
import { contentHash } from './content-hash';
import { exportCandidatePackage } from './export';
import { SafePageFetcher } from './fetch-page';
import { approvedQueue, loadManifest } from './manifest';
import { writeManifestReviewCsv } from './manifest-review';
import { classifyPage, detectAccessBarrier } from './page-classifier';
import { SerialRateLimiter } from './rate-limiter';
import { assertSafeOutput, containsPii, redactText } from './redact';
import { RobotsPolicy } from './robots-policy';
import { stopReason } from './stop-policy';
import type { IntakeReport, IntakeStatus, RejectedSource, SourceSignal } from './types';
import { robotsUrlFor } from './url-policy';

interface Arguments { command: 'validate' | 'dry-run' | 'review' | 'run'; manifest: string; output?: string; allowNetwork: boolean; acknowledgePublicOnly: boolean; maxPages: number }

function parseArguments(argv: string[]): Arguments {
  const command = argv[0] as Arguments['command'];
  if (!['validate', 'dry-run', 'review', 'run'].includes(command)) throw new Error('command must be validate, dry-run, review, or run');
  const value = (name: string) => {
    const bareName = name.replace(/^--/, '');
    const assigned = argv.find((argument) => argument.startsWith(`${name}=`) || argument.startsWith(`${bareName}=`));
    if (assigned) return assigned.slice(assigned.indexOf('=') + 1);
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  const maxPages = Number(value('--max-pages') ?? 100);
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 100) throw new Error('--max-pages must be an integer from 1 to 100');
  return {
    command,
    manifest: resolve(value('--manifest') ?? 'quality/nowcoder-intake/manifests/pilot-100.json'),
    output: value('--output') ? resolve(value('--output')!) : undefined,
    allowNetwork: argv.includes('--allow-network') || argv.includes('allow-network'),
    acknowledgePublicOnly: argv.includes('--acknowledge-public-only') || argv.includes('acknowledge-public-only'),
    maxPages,
  };
}

async function requireEmptyOutput(path: string): Promise<void> {
  try {
    if (!(await stat(path)).isDirectory()) throw new Error('--output must be a directory');
    if ((await readdir(path)).length) throw new Error('--output directory must be empty');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

export async function runCli(argv = process.argv.slice(2)): Promise<void> {
  const args = parseArguments(argv);
  const manifest = await loadManifest(args.manifest);
  const queue = approvedQueue(manifest).slice(0, args.maxPages);
  if (args.command === 'validate') {
    console.log(JSON.stringify({ valid: true, total: manifest.sources.length, approved: queue.length, networkRequests: 0 }, null, 2));
    return;
  }
  if (args.command === 'dry-run') {
    console.log(JSON.stringify({ networkRequests: 0, approvedQueue: queue.map((source) => ({ sourceId: source.sourceId, url: source.url, robotsUrl: robotsUrlFor(source.url), pageType: source.pageType })), delaySeconds: '8-12 (or stricter robots crawl-delay)', output: args.output ?? null }, null, 2));
    return;
  }
  if (args.command === 'review') {
    if (!args.output) throw new Error('review requires --output <csv-file>');
    await writeManifestReviewCsv(args.output, manifest);
    console.log(JSON.stringify({ written: args.output, candidates: manifest.sources.length, networkRequests: 0 }, null, 2));
    return;
  }
  if (!args.allowNetwork || !args.acknowledgePublicOnly) throw new Error('run requires --allow-network and --acknowledge-public-only');
  if (!args.output) throw new Error('run requires --output <empty-directory>');
  if (!queue.length) throw new Error('run requires at least one approved source');
  await requireEmptyOutput(args.output);

  const startedAt = new Date().toISOString();
  const statuses: IntakeStatus[] = [];
  const signals: SourceSignal[] = [];
  const rejected: RejectedSource[] = [];
  const hashes = new Set<string>();
  const limiter = new SerialRateLimiter();
  const fetcher = new SafePageFetcher(new RobotsPolicy(fetch, limiter), limiter);
  let stopped: string | undefined;
  const controller = new AbortController();
  const abort = () => controller.abort(new Error('operator_interrupt'));
  process.once('SIGINT', abort);
  try {
    for (const source of queue) {
      const result = await fetcher.fetch(source.url, controller.signal);
      if (!result.ok) {
        statuses.push(result.status);
        rejected.push({ sourceId: source.sourceId, sourceUrl: source.url, status: result.status as Exclude<IntakeStatus, 'success'>, reason: result.reason });
      } else {
        const barrier = detectAccessBarrier(result.html);
        if (barrier) {
          statuses.push('unsupported_page');
          rejected.push({ sourceId: source.sourceId, sourceUrl: result.finalUrl, status: 'unsupported_page', reason: barrier });
        } else {
          const article = extractArticle(result.html, result.finalUrl);
          if (!article) {
            statuses.push('insufficient_signal');
            rejected.push({ sourceId: source.sourceId, sourceUrl: result.finalUrl, status: 'insufficient_signal', reason: 'article extraction produced too little text' });
          } else {
            const classification = classifyPage(result.finalUrl, article.title, article.text, source.pageType);
            if (!classification.ok) {
              statuses.push('unsupported_page');
              rejected.push({ sourceId: source.sourceId, sourceUrl: result.finalUrl, status: 'unsupported_page', reason: classification.reason });
            } else {
              const redacted = redactText(`${article.title} ${article.text}`);
              if (containsPii(redacted.text)) {
                statuses.push('privacy_rejected');
                rejected.push({ sourceId: source.sourceId, sourceUrl: result.finalUrl, status: 'privacy_rejected', reason: 'PII remained after redaction' });
              } else {
                const signal = extractSignals(source, result.finalUrl, redacted.text, new Date().toISOString(), contentHash(`${article.title} ${article.text}`));
                let outputIsSafe = true;
                try {
                  assertSafeOutput(signal);
                } catch {
                  outputIsSafe = false;
                  statuses.push('privacy_rejected');
                  rejected.push({ sourceId: source.sourceId, sourceUrl: result.finalUrl, status: 'privacy_rejected', reason: 'output privacy gate rejected signal' });
                }
                if (outputIsSafe && !signal.topicIds.length) {
                  statuses.push('insufficient_signal');
                  rejected.push({ sourceId: source.sourceId, sourceUrl: result.finalUrl, status: 'insufficient_signal', reason: 'no recognized technical topic' });
                } else if (outputIsSafe && hashes.has(signal.contentHash)) {
                  statuses.push('duplicate_content');
                  rejected.push({ sourceId: source.sourceId, sourceUrl: result.finalUrl, status: 'duplicate_content', reason: 'normalized content hash already processed' });
                } else if (outputIsSafe) {
                  hashes.add(signal.contentHash);
                  signals.push(signal);
                  statuses.push('success');
                }
              }
            }
          }
        }
      }
      stopped = stopReason(statuses, args.maxPages);
      if (stopped) break;
    }
  } catch (error) {
    stopped = controller.signal.aborted ? 'operator_interrupt' : `unexpected_error:${String(error)}`;
  } finally {
    process.removeListener('SIGINT', abort);
  }
  const statusCounts: Partial<Record<IntakeStatus, number>> = {};
  for (const status of statuses) statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  const report: IntakeReport = {
    schemaVersion: 1, startedAt, finishedAt: new Date().toISOString(), requested: queue.length,
    processed: statuses.length, succeeded: signals.length, rejected: rejected.length,
    duplicateCount: statusCounts.duplicate_content ?? 0, statusCounts, ...(stopped ? { stoppedReason: stopped } : {}),
  };
  await exportCandidatePackage(args.output, signals, rejected, report);
  console.log(JSON.stringify(report, null, 2));
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  runCli().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
