import { classifyRecruiting, classifyRole } from './classify-role';
import { contentHash } from './content-hash';
import { classifyTopics } from './topic-taxonomy';
import type { PageType, SourceManifestEntry, SourceSignal } from './types';

function matches<T extends string>(text: string, rules: [T, RegExp][]): T[] {
  return rules.filter(([, pattern]) => pattern.test(text)).map(([value]) => value);
}

function choiceSignals(text: string, pageType: PageType): SourceSignal['choiceSignals'] {
  if (pageType !== 'multiple-choice') return undefined;
  const deep = /系统设计|推导|复杂度|边界|故障|权衡/i.test(text);
  const application = /场景|排查|计算|实践|部署/i.test(text);
  return {
    cognitiveLevel: deep ? 'deep' : application ? 'application' : 'foundation',
    distractorTypes: matches(text, [
      ['absolute-claim', /一定|必须|永远|绝对|完全/i],
      ['missing-condition', /条件|前提|仅当|除非/i],
      ['concept-swap', /混淆|错误概念|偷换/i],
    ]),
    answerCueTypes: matches(text, [
      ['length-outlier', /长度|最长|最短/i],
      ['wording-overlap', /重复|同义|照抄/i],
      ['format-outlier', /格式|符号|单位/i],
    ]),
  };
}

export function extractSignals(source: SourceManifestEntry, finalUrl: string, text: string, collectedAt = new Date().toISOString(), hash = contentHash(text)): SourceSignal {
  const topicIds = classifyTopics(text);
  const followUpTypes = matches(text, [
    ['principle', /原理|为什么|机制/i], ['boundary', /边界|条件|什么时候失效/i],
    ['debugging', /排查|故障|定位|失败/i], ['metrics', /指标|召回率|准确率|延迟|吞吐/i],
    ['system-design', /系统设计|架构/i], ['tradeoff', /权衡|取舍|成本/i],
  ] as const);
  const misconceptionTypes = matches(text, [
    ['concept-confusion', /混淆|区别|不是同一/i], ['missing-condition', /条件遗漏|缺少前提/i],
    ['causal-reversal', /因果倒置/i], ['complexity-error', /复杂度误判|复杂度错误/i], ['metric-misuse', /指标误用/i],
  ] as const);
  const years = text.match(/20(?:2[0-9]|3[0-9])/g)?.map(Number).filter((year) => year <= new Date().getFullYear() + 1) ?? [];
  const evidenceCount = topicIds.length + followUpTypes.length + misconceptionTypes.length;
  return {
    schemaVersion: 1,
    sourceId: source.sourceId,
    sourceUrl: finalUrl,
    pageType: source.pageType,
    collectedAt,
    contentHash: hash,
    role: classifyRole(text),
    recruitingStage: classifyRecruiting(text),
    ...(years.length ? { year: Math.max(...years) } : {}),
    topicIds,
    followUpTypes,
    misconceptionTypes,
    ...(source.pageType === 'multiple-choice' ? { choiceSignals: choiceSignals(text, source.pageType) } : {}),
    confidence: evidenceCount >= 5 ? 'high' : evidenceCount >= 2 ? 'medium' : 'low',
    reviewStatus: 'pending',
  };
}
