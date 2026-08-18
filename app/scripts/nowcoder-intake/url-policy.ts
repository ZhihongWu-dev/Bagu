import { isIP } from 'node:net';
import { ALLOWED_HOSTS, SENSITIVE_QUERY_KEY, TRACKING_QUERY_KEY } from './config';

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local')) return true;
  const ipVersion = isIP(host);
  if (!ipVersion) return false;
  if (ipVersion === 6) return host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:');
  const parts = host.split('.').map(Number);
  return parts[0] === 10 || parts[0] === 127 || (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168);
}

export function normalizeApprovedUrl(rawUrl: string, allowedHosts = ALLOWED_HOSTS): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('invalid_url');
  }
  if (url.protocol !== 'https:') throw new Error('https_required');
  if (url.username || url.password) throw new Error('credentials_forbidden');
  const hostname = url.hostname.toLowerCase();
  if (isPrivateHost(hostname)) throw new Error('private_host_forbidden');
  if (!allowedHosts.has(hostname)) throw new Error('host_not_allowed');
  const decodedLocation = decodeURIComponent(`${url.pathname}${url.search}`);
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(decodedLocation) || /(?<!\d)1[3-9]\d{9}(?!\d)/.test(decodedLocation)) {
    throw new Error('pii_in_url');
  }
  for (const key of [...url.searchParams.keys()]) {
    if (SENSITIVE_QUERY_KEY.test(key)) throw new Error(`sensitive_query_parameter:${key}`);
    if (TRACKING_QUERY_KEY.test(key)) url.searchParams.delete(key);
  }
  url.hash = '';
  url.hostname = hostname;
  if (url.port === '443') url.port = '';
  url.searchParams.sort();
  return url.toString();
}

export function robotsUrlFor(rawUrl: string): string {
  const url = new URL(normalizeApprovedUrl(rawUrl));
  return `${url.origin}/robots.txt`;
}
