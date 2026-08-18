export const INTAKE_USER_AGENT = 'BaguResearchIntake/1.0 (+public-content-research; no-login)';
export const ALLOWED_HOSTS = new Set(['www.nowcoder.com']);
export const MAX_APPROVED_PAGES = 100;
export const MIN_REQUEST_DELAY_MS = 8_000;
export const MAX_REQUEST_DELAY_MS = 12_000;
export const REQUEST_TIMEOUT_MS = 15_000;
export const MAX_HTML_BYTES = 2_000_000;
export const MAX_ROBOTS_BYTES = 500_000;
export const MAX_REDIRECTS = 3;

export const SENSITIVE_QUERY_KEY = /(?:token|auth|session|cookie|email|mail|phone|mobile|password|passwd|secret|key|code)/i;
export const TRACKING_QUERY_KEY = /^(?:utm_.+|spm|from|source|sourceSSR|urlSource|weFlow|ref|refer|share_uid|channel|trackId|mutiTagIds|onlyReference|orderByHotValue|page|entranceType_var)$/i;
