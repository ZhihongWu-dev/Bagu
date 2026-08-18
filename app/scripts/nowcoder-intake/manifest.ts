import { readFile } from 'node:fs/promises';
import { MAX_APPROVED_PAGES } from './config';
import type { ApprovalStatus, PageType, SourceManifest, SourceManifestEntry } from './types';
import { normalizeApprovedUrl } from './url-policy';

const PAGE_TYPES = new Set<PageType>(['interview', 'multiple-choice']);
const APPROVALS = new Set<ApprovalStatus>(['discovered', 'approved', 'rejected']);

export function validateManifest(value: unknown): SourceManifest {
  if (!value || typeof value !== 'object') throw new Error('manifest_must_be_object');
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !['manifestVersion', 'sources'].includes(key))) throw new Error('unknown_manifest_field');
  if (record.manifestVersion !== 1 || !Array.isArray(record.sources)) throw new Error('invalid_manifest_shape');
  const ids = new Set<string>();
  const urls = new Set<string>();
  let approved = 0;
  const sources = record.sources.map((item, index): SourceManifestEntry => {
    if (!item || typeof item !== 'object') throw new Error(`invalid_source:${index}`);
    const row = item as Record<string, unknown>;
    const allowed = new Set(['sourceId', 'url', 'pageType', 'approvalStatus', 'discoveryQuery', 'discoveredAt', 'reviewNote']);
    if (Object.keys(row).some((key) => !allowed.has(key))) throw new Error(`unknown_source_field:${index}`);
    const required = ['sourceId', 'url', 'pageType', 'approvalStatus', 'discoveryQuery', 'discoveredAt'] as const;
    for (const key of required) if (typeof row[key] !== 'string' || !row[key]) throw new Error(`invalid_${key}:${index}`);
    if (!PAGE_TYPES.has(row.pageType as PageType)) throw new Error(`invalid_page_type:${index}`);
    if (!APPROVALS.has(row.approvalStatus as ApprovalStatus)) throw new Error(`invalid_approval:${index}`);
    if (Number.isNaN(Date.parse(row.discoveredAt as string))) throw new Error(`invalid_discovered_at:${index}`);
    if (row.reviewNote !== undefined && typeof row.reviewNote !== 'string') throw new Error(`invalid_review_note:${index}`);
    const sourceId = row.sourceId as string;
    if (!/^[a-z0-9][a-z0-9-]{2,79}$/.test(sourceId)) throw new Error(`invalid_source_id:${index}`);
    if (ids.has(sourceId)) throw new Error(`duplicate_source_id:${sourceId}`);
    ids.add(sourceId);
    const normalized = normalizeApprovedUrl(row.url as string);
    if (urls.has(normalized)) throw new Error(`duplicate_url:${normalized}`);
    urls.add(normalized);
    if (row.approvalStatus === 'approved') approved += 1;
    return {
      sourceId,
      url: normalized,
      pageType: row.pageType as PageType,
      approvalStatus: row.approvalStatus as ApprovalStatus,
      discoveryQuery: row.discoveryQuery as string,
      discoveredAt: row.discoveredAt as string,
      ...(typeof row.reviewNote === 'string' ? { reviewNote: row.reviewNote } : {}),
    };
  });
  if (approved > MAX_APPROVED_PAGES) throw new Error(`approved_page_limit_exceeded:${approved}`);
  return { manifestVersion: 1, sources };
}

export async function loadManifest(path: string): Promise<SourceManifest> {
  return validateManifest(JSON.parse(await readFile(path, 'utf8')));
}

export function approvedQueue(manifest: SourceManifest): SourceManifestEntry[] {
  return manifest.sources.filter((source) => source.approvalStatus === 'approved');
}
