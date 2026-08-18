import type { AnswerCueType, CognitiveLevel, DistractorType, FollowUpType, MisconceptionType, RecruitingStage, Relevance, Role, SkipReason } from './types';
import type { TopicId } from '../nowcoder-intake/types';

export const ROLES = ['llm_algorithm', 'llm_application', 'shared', 'unknown'] as const satisfies readonly Role[];
export const RECRUITING_STAGES = ['campus-autumn', 'campus-other', 'unknown'] as const satisfies readonly RecruitingStage[];
export const RELEVANCES = ['relevant', 'not-relevant', 'uncertain'] as const satisfies readonly Relevance[];
export const TOPIC_IDS = [
  'transformer-attention', 'position-encoding', 'training-objectives', 'sft-lora-quantization',
  'alignment-rlhf-dpo-grpo', 'inference-serving-vllm', 'kv-cache-performance',
  'rag-retrieval-rerank', 'redis-vector-database', 'agent-tool-workflow',
  'evaluation-safety-observability',
] as const satisfies readonly TopicId[];
export const FOLLOW_UP_TYPES = ['principle', 'boundary', 'debugging', 'metrics', 'system-design', 'tradeoff'] as const satisfies readonly FollowUpType[];
export const MISCONCEPTION_TYPES = ['concept-confusion', 'missing-condition', 'causal-reversal', 'complexity-error', 'metric-misuse'] as const satisfies readonly MisconceptionType[];
export const COGNITIVE_LEVELS = ['foundation', 'application', 'deep'] as const satisfies readonly CognitiveLevel[];
export const DISTRACTOR_TYPES = ['implausible', 'overlap', 'absolute-claim', 'different-scope', 'missing-condition', 'non-unique-answer'] as const satisfies readonly DistractorType[];
export const ANSWER_CUE_TYPES = ['length', 'position', 'wording', 'format', 'stem-repeat'] as const satisfies readonly AnswerCueType[];
export const SKIP_REASONS = ['login-unavailable', 'page-missing', 'insufficient-content', 'irrelevant', 'duplicate', 'cannot-assess', 'other'] as const satisfies readonly SkipReason[];

export const TAXONOMY_LABELS = {
  role: { llm_algorithm: '大模型算法工程师', llm_application: '大模型应用工程师', shared: '两类岗位共有', unknown: '无法判断' },
  recruitingStage: { 'campus-autumn': '校招 / 秋招', 'campus-other': '其他校招阶段', unknown: '无法判断' },
  relevance: { relevant: '相关', 'not-relevant': '无关', uncertain: '无法确定' },
  topic: {
    'transformer-attention': 'Transformer 与 Attention', 'position-encoding': '位置编码', 'training-objectives': '预训练目标',
    'sft-lora-quantization': 'SFT / LoRA / 量化', 'alignment-rlhf-dpo-grpo': 'RLHF / DPO / GRPO',
    'inference-serving-vllm': '推理服务与 vLLM', 'kv-cache-performance': 'KV Cache 与性能',
    'rag-retrieval-rerank': 'RAG / 检索 / Rerank', 'redis-vector-database': 'Redis 与向量数据库',
    'agent-tool-workflow': 'Agent / 工具 / 工作流', 'evaluation-safety-observability': '评测 / 安全 / 可观测性',
  },
  followUp: { principle: '原理', boundary: '边界条件', debugging: '故障排查', metrics: '指标', 'system-design': '系统设计', tradeoff: '方案权衡' },
  misconception: { 'concept-confusion': '概念混淆', 'missing-condition': '条件遗漏', 'causal-reversal': '因果倒置', 'complexity-error': '复杂度误判', 'metric-misuse': '指标误用' },
  cognitiveLevel: { foundation: '基础理解', application: '应用判断', deep: '深入推理' },
  distractor: { implausible: '干扰项明显荒谬', overlap: '选项语义重叠', 'absolute-claim': '绝对化表述', 'different-scope': '概念层级不一致', 'missing-condition': '缺少成立条件', 'non-unique-answer': '答案不唯一' },
  answerCue: { length: '正确项长度异常', position: '答案位置有规律', wording: '措辞暴露答案', format: '格式暴露答案', 'stem-repeat': '照抄题干关键词' },
  skipReason: { 'login-unavailable': '无法登录查看', 'page-missing': '页面不存在', 'insufficient-content': '内容太少', irrelevant: '与目标无关', duplicate: '重复来源', 'cannot-assess': '无法形成判断', other: '其他原因' },
} as const;

export function taxonomyPayload() {
  return {
    roles: ROLES, recruitingStages: RECRUITING_STAGES, relevances: RELEVANCES, topicIds: TOPIC_IDS,
    followUpTypes: FOLLOW_UP_TYPES, misconceptionTypes: MISCONCEPTION_TYPES, cognitiveLevels: COGNITIVE_LEVELS,
    distractorTypes: DISTRACTOR_TYPES, answerCueTypes: ANSWER_CUE_TYPES, skipReasons: SKIP_REASONS,
    labels: TAXONOMY_LABELS,
  };
}
