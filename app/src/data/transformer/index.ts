import type { CourseUnit, KnowledgeKeyword } from '@/types/course';

import { toMathExpression } from '@/data/math-expression';
import { architectureSection } from './architecture-section';
import { attentionSection } from './attention-section';
import { blockSection } from './block-section';
import { inferenceSection } from './inference-section';
import { positionSection } from './position-section';

export const keywords: Record<string, KnowledgeKeyword> = {
  logit: { id: 'logit', label: 'Logit', definition: '模型在归一化前输出的原始分数。', intuition: '相对大小决定 Softmax 后的概率分布。', formula: toMathExpression('pᵢ=exp(zᵢ)/Σⱼexp(zⱼ)') },
  saturation: { id: 'saturation', label: 'Softmax 饱和', definition: '概率过度接近 0 或 1，局部斜率和有效梯度变小。', intuition: '最大分数压倒其他候选后，继续拉大差距几乎不再改变输出。', formula: toMathExpression('∂softmax/∂z→0') },
  query: { id: 'query', label: 'Query', definition: '当前位置主动检索相关信息时使用的查询表示。', intuition: 'Query 是当前 token 提出的问题。', formula: toMathExpression('Q=XWQ') },
  head: { id: 'head', label: 'Attention Head', definition: '一组独立的 Q、K、V 投影与注意力计算。', intuition: '不同头可以在不同子空间观察关系。', formula: toMathExpression('headᵢ=Attention(QWᵢQ,KWᵢK,VWᵢV)') },
  mask: { id: 'mask', label: 'Attention Mask', definition: '在 Softmax 前排除无效或不可见位置的约束。', intuition: '把不允许读取的位置从候选集中移除。', formula: toMathExpression('softmax(S+M)') },
  residual: { id: 'residual', label: '残差连接', definition: '把子层输入直接加到子层输出。', intuition: '给信息和梯度保留一条恒等高速路。', formula: toMathExpression('y=x+F(x)') },
  rope: { id: 'rope', label: 'RoPE', definition: '按位置对 Query 和 Key 的二维通道施加旋转。', intuition: '旋转角度差让内积携带相对位移。', formula: toMathExpression('(R(m)q)ᵀ(R(n)k)=qᵀR(n−m)k') },
  cache: { id: 'cache', label: 'KV Cache', definition: '缓存每层历史 token 已计算的 Key 和 Value。', intuition: '生成新 token 时不再重复计算历史 K/V。' },
  flash: { id: 'flash', label: 'FlashAttention', definition: '通过分块和在线 Softmax 减少注意力的显存读写。', intuition: '不物化完整分数矩阵，把数据尽量留在快速片上存储。' },
};

export const transformerUnit: CourseUnit = {
  id: 'transformer',
  title: 'Unit 1 · Transformer',
  subtitle: '从 Attention 到高效推理',
  description: '5 个 Section · 25 个节点 · 每节点 12 题',
  sections: [attentionSection, blockSection, positionSection, architectureSection, inferenceSection],
};

export const transformerNodes = transformerUnit.sections.flatMap((section) => section.nodes);
