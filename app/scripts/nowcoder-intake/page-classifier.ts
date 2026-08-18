import type { PageType } from './types';

const BLOCKED_PATTERNS: [RegExp, string][] = [
  [/(?:请登录|登录后查看|sign\s*in|log\s*in)/i, 'login_required'],
  [/(?:验证码|安全验证|captcha)/i, 'captcha'],
  [/(?:开通会员|付费后|购买后|paywall|subscribe to read)/i, 'paywall'],
];

export type PageClassification =
  | { ok: true; pageType: PageType }
  | { ok: false; reason: string };

export function detectAccessBarrier(sample: string): string | undefined {
  return BLOCKED_PATTERNS.find(([pattern]) => pattern.test(sample))?.[1];
}

export function classifyPage(url: string, title: string, text: string, expected: PageType): PageClassification {
  const sample = `${title}\n${text.slice(0, 4000)}`;
  const barrier = detectAccessBarrier(sample);
  if (barrier) return { ok: false, reason: barrier };
  const choiceScore = [/(?:选择题|单选|多选|正确答案|选项|练习)/i, /(?:question|exam|practice)/i].filter((p) => p.test(sample)).length;
  const interviewScore = [/(?:面经|面试|一面|二面|秋招|校招|岗位)/i, /(?:interview|recruit)/i].filter((p) => p.test(sample)).length;
  const path = new URL(url).pathname.toLowerCase();
  const inferred: PageType | undefined = choiceScore > interviewScore ? 'multiple-choice' : interviewScore > choiceScore ? 'interview' :
    path.includes('exam') || path.includes('question') ? 'multiple-choice' : path.includes('discuss') ? 'interview' : undefined;
  if (inferred && inferred !== expected) return { ok: false, reason: 'manifest_page_type_mismatch' };
  return { ok: true, pageType: expected };
}
