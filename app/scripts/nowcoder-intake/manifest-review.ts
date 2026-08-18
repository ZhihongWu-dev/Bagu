import { writeFile } from 'node:fs/promises';
import type { SourceManifest } from './types';

function cell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function manifestReviewCsv(manifest: SourceManifest): string {
  const rows = manifest.sources.map((source) => [source.sourceId, source.url, source.pageType, source.discoveryQuery, source.discoveredAt, source.approvalStatus, source.reviewNote ?? '']);
  return [['sourceId', 'url', 'pageType', 'discoveryQuery', 'discoveredAt', 'approvalStatus', 'reviewNote'], ...rows].map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n';
}

export async function writeManifestReviewCsv(path: string, manifest: SourceManifest): Promise<void> {
  await writeFile(path, manifestReviewCsv(manifest), { encoding: 'utf8', flag: 'w' });
}
