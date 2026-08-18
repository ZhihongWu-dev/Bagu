import { createHash } from 'node:crypto';

export function normalizeForHash(text: string): string {
  return text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').replace(/(\p{Script=Han})\s+(?=\p{Script=Han})/gu, '$1').trim();
}

export function contentHash(text: string): string {
  return createHash('sha256').update(normalizeForHash(text), 'utf8').digest('hex');
}
