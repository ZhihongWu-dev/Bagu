const PII_PATTERNS: RegExp[] = [
  /(?<!\d)1[3-9]\d{9}(?!\d)/g,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /(?:微信|wechat|wx)\s*[:：]?\s*[a-zA-Z][-_a-zA-Z0-9]{5,19}/gi,
  /(?:QQ|扣扣)\s*[:：]?\s*[1-9]\d{4,11}/gi,
  /https?:\/\/(?:qm\.qq\.com|weixin\.qq\.com|chat\.whatsapp\.com)\/\S+/gi,
  /(?:内推码|邀请码|推荐码)\s*[:：]?\s*[A-Z0-9_-]{4,}/gi,
];

const IDENTITY_BLOCK = /(?:作者|昵称|个人信息|联系方式|简历)\s*[:：]?[^。！？\n]{0,160}/gi;

export function redactText(text: string): { text: string; redactions: number } {
  let redactions = 0;
  let sanitized = text.replace(IDENTITY_BLOCK, () => { redactions += 1; return ' '; });
  for (const pattern of PII_PATTERNS) sanitized = sanitized.replace(pattern, () => { redactions += 1; return ' '; });
  return { text: sanitized.replace(/\s+/g, ' ').trim(), redactions };
}

export function containsPii(text: string): boolean {
  const pii = PII_PATTERNS.some((pattern) => { pattern.lastIndex = 0; return pattern.test(text); });
  IDENTITY_BLOCK.lastIndex = 0;
  return pii || IDENTITY_BLOCK.test(text);
}

const FORBIDDEN_OUTPUT_KEYS = new Set(['rawHtml', 'rawText', 'excerpt', 'questionText', 'choices', 'answerText', 'author', 'username', 'byline']);

export function assertSafeOutput(value: unknown): void {
  const visit = (item: unknown): void => {
    if (typeof item === 'string' && containsPii(item)) throw new Error('pii_in_output');
    if (Array.isArray(item)) return item.forEach(visit);
    if (!item || typeof item !== 'object') return;
    for (const [key, child] of Object.entries(item)) {
      if (FORBIDDEN_OUTPUT_KEYS.has(key)) throw new Error(`forbidden_output_field:${key}`);
      visit(child);
    }
  };
  visit(value);
}
