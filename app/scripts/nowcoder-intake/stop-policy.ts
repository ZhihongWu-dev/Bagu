import type { IntakeStatus } from './types';

const ACCESS_CONTROL = new Set<IntakeStatus>(['robots_disallowed', 'robots_unavailable', 'redirect_blocked']);
const FAILURE = new Set<IntakeStatus>(['network_error', 'unsupported_page', 'insufficient_signal', 'privacy_rejected']);

export function stopReason(statuses: IntakeStatus[], maxPages: number): string | undefined {
  if (statuses.length >= maxPages) return 'page_limit_reached';
  if (statuses.slice(-10).length === 10 && statuses.slice(-10).every((status) => ACCESS_CONTROL.has(status))) return 'ten_consecutive_access_controls';
  const recent = statuses.slice(-20);
  if (recent.length === 20 && recent.filter((status) => FAILURE.has(status)).length > 10) return 'recent_failure_rate_above_50_percent';
  return undefined;
}
