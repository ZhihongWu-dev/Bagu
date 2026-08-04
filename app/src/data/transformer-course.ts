import type { KnowledgeKeyword, Lesson } from '@/types/course';

export const keywords: Record<string, KnowledgeKeyword> = {
  logit: {
    id: 'logit',
    label: 'Logit',
    definition: '模型在归一化之前输出的原始分数。',
    intuition: 'Logit 之间的相对大小决定 Softmax 后的概率分布。',
    formula: 'pᵢ = exp(zᵢ) / Σ exp(zⱼ)',
  },
  saturation: {
    id: 'saturation',
    label: 'Softmax 饱和',
    definition: '输出概率非常接近 0 或 1，函数局部斜率变小。',
    intuition: '反向传播的梯度会因此减弱，使参数更新变慢。',
    formula: 'pᵢ = exp(zᵢ) / Σ exp(zⱼ)',
  },
  query: {
    id: 'query',
    label: 'Query',
    definition: '当前 token 主动寻找相关信息时使用的查询表示。',
    intuition: '可以把 Query 理解为当前 token 提出的问题。',
    formula: 'Q = XWQ',
  },
  head: {
    id: 'head',
    label: 'Attention Head',
    definition: '一组独立的 Q、K、V 投影与注意力计算。',
    intuition: '不同头可以从不同表示子空间捕捉关系。',
    formula: 'headᵢ = Attention(QWᵢQ, KWᵢK, VWᵢV)',
  },
};

export const transformerLessons: Lesson[] = [
  {
    id: 'qkv',
    title: 'Q、K、V 到底是什么？',
    shortTitle: 'Q · K · V',
    subtitle: '理解 Attention 中三个核心投影的分工',
    icon: 'Q',
    duration: 6,
    exercises: [
      {
        id: 'qkv-meaning',
        eyebrow: '选择最准确的描述',
        prompt: '在 Self-Attention 中，Query 最接近下面哪种含义？',
        choices: [
          { id: 'a', label: '当前 token 想要查询的信息需求' },
          { id: 'b', label: '所有 token 最终输出的概率' },
          { id: 'c', label: '用于记录 token 绝对位置的编码' },
        ],
        correctChoiceId: 'a',
        explanation: 'Query 表示当前 token 的信息需求，Key 用于被匹配，Value 携带最终聚合的内容。',
        coveredPoints: ['Query 发起匹配', 'Key 表示被匹配特征'],
        missingPoint: 'Value 承载被聚合的信息',
        keywords: ['query'],
      },
    ],
  },
  {
    id: 'scaled-dot-product',
    title: '为什么要除以 √dₖ？',
    shortTitle: '缩放点积',
    subtitle: '从方差、Softmax 与梯度解释缩放因子',
    icon: '√',
    duration: 7,
    exercises: [
      {
        id: 'scale-reason',
        eyebrow: '选择缺失的关键概念',
        prompt: '为什么 Attention 的点积结果需要除以 √dₖ？',
        formula: 'softmax(QKᵀ / √dₖ)V',
        choices: [
          { id: 'a', label: '降低模型参数量' },
          { id: 'b', label: '避免 Softmax 进入饱和区' },
          { id: 'c', label: '消除序列位置信息' },
        ],
        correctChoiceId: 'b',
        explanation: '点积方差随维度增大，Logit 差距随之变大，Softmax 容易饱和并导致梯度变小；缩放能让训练更稳定。',
        coveredPoints: ['点积方差增大', 'Softmax 容易饱和'],
        missingPoint: '饱和会导致梯度变小',
        keywords: ['logit', 'saturation'],
      },
    ],
  },
  {
    id: 'multi-head',
    title: '为什么需要多头注意力？',
    shortTitle: '多头注意力',
    subtitle: '理解不同表示子空间与信息融合',
    icon: 'M',
    duration: 8,
    exercises: [
      {
        id: 'multi-head-benefit',
        eyebrow: '判断主要优势',
        prompt: 'Multi-Head Attention 相比单头最核心的优势是什么？',
        choices: [
          { id: 'a', label: '彻底消除 Attention 的平方复杂度' },
          { id: 'b', label: '让不同头在不同表示子空间学习关系' },
          { id: 'c', label: '不再需要任何位置编码' },
        ],
        correctChoiceId: 'b',
        explanation: '多个 Attention Head 使用不同投影，可以并行关注语义、句法、位置等不同关系，随后拼接并再次投影。',
        coveredPoints: ['独立投影', '不同表示子空间'],
        missingPoint: '多头结果会拼接后再线性投影',
        keywords: ['head'],
      },
    ],
  },
];

