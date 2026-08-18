import { mkdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { aggregateSignals } from './aggregate';
import { assertSafeOutput } from './redact';
import type { IntakeReport, RejectedSource, SourceSignal } from './types';

function csvCell(value: unknown): string {
  const text = Array.isArray(value) ? value.join('|') : value == null ? '' : String(value);
  const injectionSafe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${injectionSafe.replace(/"/g, '""')}"`;
}

export function signalsToCsv(signals: SourceSignal[]): string {
  const columns = ['sourceId', 'sourceUrl', 'pageType', 'collectedAt', 'contentHash', 'role', 'recruitingStage', 'year', 'topicIds', 'followUpTypes', 'misconceptionTypes', 'confidence', 'reviewStatus'] as const;
  return [columns.map(csvCell).join(','), ...signals.map((signal) => columns.map((key) => csvCell(signal[key])).join(','))].join('\r\n') + '\r\n';
}

function jsonl(values: unknown[]): string {
  return values.map((value) => JSON.stringify(value)).join('\n') + (values.length ? '\n' : '');
}

async function atomicWrite(path: string, content: string): Promise<void> {
  const temporary = `${path}.tmp`;
  await writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' });
  await rename(temporary, path);
}

export async function exportCandidatePackage(outputDirectory: string, signals: SourceSignal[], rejected: RejectedSource[], report: IntakeReport): Promise<void> {
  assertSafeOutput(signals);
  assertSafeOutput(rejected);
  assertSafeOutput(report);
  const summary = aggregateSignals(signals);
  assertSafeOutput(summary);
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    atomicWrite(join(outputDirectory, 'source-signals.jsonl'), jsonl(signals)),
    atomicWrite(join(outputDirectory, 'source-signals.csv'), signalsToCsv(signals)),
    atomicWrite(join(outputDirectory, 'topic-summary.json'), JSON.stringify(summary, null, 2) + '\n'),
    atomicWrite(join(outputDirectory, 'intake-report.json'), JSON.stringify(report, null, 2) + '\n'),
    atomicWrite(join(outputDirectory, 'rejected-sources.jsonl'), jsonl(rejected)),
  ]);
}
