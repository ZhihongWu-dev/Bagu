import { buildExplicitQuestionNode, multipleQuestion, orderingQuestion, recallQuestion, singleQuestion } from '../../question-builders';

// Scaling rationale follows Vaswani et al., section 3.2.1.
export const scaledDotProductNode = buildExplicitQuestionNode({
  id: 'scaled-dot-product', title: '缩放点积注意力', shortTitle: '缩放点积', subtitle: '理解为什么除以 √dₖ',
  icon: 'scale', knowledgeIds: ['attention-scale'],
  exercises: [
    singleQuestion({
      id: 'scaled-dot-product-01', cognitiveLevel: 'foundation', learningObjectiveId: 'scale-identify-factor',
      eyebrow: '基础判断', prompt: 'Scaled Dot-Product Attention 在 Softmax 前通常用哪个量缩放 QKᵀ？',
      choices: ['以点积维度的平方根为除数', '以点积维度本身为除数', '分别按点积维度的平方根缩小 Q 和 K', '以完整隐藏维度的平方根为除数'], correctChoiceId: 'a',
      explanation: '标准形式用 1/√dₖ 缩放一次完整点积。除以 dₖ 会过度缩小；Q、K 各除以 √dₖ 等价于总共除以 dₖ；使用 Dmodel 则混淆了总隐藏维与每头点积维。',
      coveredPoints: ['识别缩放因子及 dₖ 含义'], keywords: ['logit', 'saturation'], practiceKind: 'concept',
    }),
    orderingQuestion({
      id: 'scaled-dot-product-02', cognitiveLevel: 'foundation', learningObjectiveId: 'scale-computation-order',
      eyebrow: '排序 · 流程', prompt: '按缩放点积注意力的计算顺序排列。',
      choices: [
        { id: 'a', label: '对 Value 加权求和' }, { id: 'b', label: '计算 QKᵀ' },
        { id: 'c', label: '对分数做 Softmax' }, { id: 'd', label: '用 √dₖ 缩放并加入 Mask' },
      ], correctOrder: ['b', 'd', 'c', 'a'],
      explanation: '缩放和 Mask 都作用于归一化前的 Logit；Softmax 得到权重后才聚合 Value。',
      coveredPoints: ['缩放、Mask、Softmax 和聚合的顺序'], keywords: ['logit', 'mask'], practiceKind: 'mechanism',
    }),
    multipleQuestion({
      id: 'scaled-dot-product-03', cognitiveLevel: 'foundation', learningObjectiveId: 'scale-purpose',
      eyebrow: '多选 · 目的', prompt: '在常见独立、零均值、单位方差近似下，使用 1/√dₖ 缩放的直接作用有哪些？',
      choices: ['抵消点积标准差随 √dₖ 增长', '缓解 Softmax 因大幅 Logit 而过度饱和', '严格固定每一行注意力的熵', '使不同头维下每个样本的 Logit 分布严格相同'], correctChoiceIds: ['a', 'b'],
      explanation: '缩放抵消点积标准差随 √dₖ 增长并缓解 Softmax 饱和；它既不固定注意力熵，也不保证不同头维或样本的实际 Logit 分布严格相同。',
      coveredPoints: ['缩放的方差动机与边界'], keywords: ['logit', 'saturation'], practiceKind: 'mechanism',
    }),
    singleQuestion({
      id: 'scaled-dot-product-04', cognitiveLevel: 'application', learningObjectiveId: 'scale-standard-deviation',
      eyebrow: '推导题', prompt: '若 qᵢkᵢ 各项近似独立、方差为 1，dₖ 个乘积之和的标准差约为多少？',
      choices: ['点积维度 dₖ 的平方根', '点积维度 dₖ 本身', '点积维度的四次方根', '与点积维度无关的常数'], correctChoiceId: 'a',
      explanation: '独立项方差相加得到约 dₖ，标准差因此约为 √dₖ；除以 √dₖ 后回到常数量级。',
      coveredPoints: ['从方差加和推出缩放因子'], keywords: ['logit'], practiceKind: 'mechanism',
    }),
    singleQuestion({
      id: 'scaled-dot-product-05', cognitiveLevel: 'application', learningObjectiveId: 'scale-dimension-change',
      eyebrow: '场景题', prompt: '头维从 64 增到 256，仍假设各分量方差相近。未缩放点积的标准差约变为原来的多少倍？',
      choices: ['2 倍', '4 倍', '1/2', '1/4'], correctChoiceId: 'a',
      explanation: '标准差与 √dₖ 成正比，因此 √256/√64=16/8=2。容易混淆的是方差会变成 4 倍。',
      coveredPoints: ['区分方差与标准差随维度的变化'], keywords: ['logit'], practiceKind: 'metrics',
    }),
    singleQuestion({
      id: 'scaled-dot-product-06', cognitiveLevel: 'application', learningObjectiveId: 'scale-debug-softmax-saturation',
      eyebrow: '排障题', prompt: '自研注意力层训练初期就出现极端接近 one-hot 的权重，且增大头维后更严重。优先检查哪项？',
      choices: ['QKᵀ 是否遗漏 1/√dₖ 缩放', '缩放是否误用了 1/dₖ，导致分数过小', 'Softmax 是否误沿 Query 轴归一化', 'Mask 的禁止位置是否误填为 0'], correctChoiceId: 'a',
      explanation: '症状随头维增大而加剧，符合未缩放点积方差增大的特征；过大的 Logit 会令 Softmax 过尖。',
      coveredPoints: ['从饱和症状定位缩放遗漏'], keywords: ['logit', 'saturation'], practiceKind: 'troubleshooting',
    }),
    multipleQuestion({
      id: 'scaled-dot-product-07', cognitiveLevel: 'application', learningObjectiveId: 'scale-order-and-semantics',
      eyebrow: '多选 · 实现', prompt: '关于缩放与 Mask 的实现，哪些说法正确？',
      choices: ['二者都应在 Softmax 前影响 Logit', '先缩放有限分数、再加 0/−∞ Mask 是常见写法', '缩放因子由 Value 维度 Dv 决定', '若先把有限极小值作为 Mask 加入再缩放，需核对低精度下禁止位置仍被充分压低'], correctChoiceIds: ['a', 'b', 'd'],
      explanation: '缩放依据 Q/K 点积维 dₖ，与 Dv 无关。数学上的 −∞ 经正缩放仍是 −∞；工程中若用有限极小值并改变操作顺序，则要核对 dtype 下的排除效果。',
      coveredPoints: ['缩放与 Mask 的实现边界'], keywords: ['logit', 'mask'], practiceKind: 'boundary',
    }),
    singleQuestion({
      id: 'scaled-dot-product-08', cognitiveLevel: 'application', learningObjectiveId: 'scale-compare-divisors',
      eyebrow: '对比题', prompt: '若误把除以 √dₖ 改成除以 dₖ，随着 dₖ 增大，缩放后 Logit 的标准差会怎样？',
      choices: ['与头维的平方根成反比地变小', '保持常数量级', '与头维本身成反比地变小', '随头维的平方根增大'], correctChoiceId: 'a',
      explanation: '原标准差约 √dₖ，再除以 dₖ 得 1/√dₖ；这会使分布随头维增大而过度平坦。',
      coveredPoints: ['比较 1/√dₖ 与 1/dₖ 的尺度效果'], keywords: ['logit', 'saturation'], practiceKind: 'mechanism',
    }),
    singleQuestion({
      id: 'scaled-dot-product-09', cognitiveLevel: 'application', learningObjectiveId: 'scale-temperature-relation',
      eyebrow: '迁移题', prompt: '在 Softmax(z/T) 中，标准注意力的 1/√dₖ 缩放最接近把温度 T 设为什么？',
      choices: ['点积维度的平方根', '点积维度平方根的倒数', '点积维度本身', 'Q 与 K 范数的乘积'], correctChoiceId: 'a',
      explanation: 'QKᵀ/√dₖ 与 z/T 形式对应 T=√dₖ。它是由点积尺度动机得到的固定温度类比。',
      coveredPoints: ['联系缩放因子与 Softmax 温度'], keywords: ['logit', 'saturation'], practiceKind: 'concept',
    }),
    multipleQuestion({
      id: 'scaled-dot-product-10', cognitiveLevel: 'deep', learningObjectiveId: 'scale-assumption-boundaries',
      eyebrow: '多选 · 假设', prompt: '“除以 √dₖ 后 Logit 方差恒为 1”这句话需要哪些限定？',
      choices: ['依赖分量尺度和相关性的近似假设', '训练后的 Q/K 分布未必满足单位方差独立假设', '只要输入经过 LayerNorm，投影后每个 Q/K 分量就严格独立且方差为 1', '缩放提供的是稳定尺度的启发式，不是逐样本方差证明'], correctChoiceIds: ['a', 'b', 'd'],
      explanation: '经典推导依赖简化统计假设。训练中分量可相关、方差可变化，因此缩放是有理论动机的稳定化设计，而非严格恒等式。',
      coveredPoints: ['识别方差推导的统计假设与结论边界'], keywords: ['logit'], practiceKind: 'boundary',
    }),
    singleQuestion({
      id: 'scaled-dot-product-11', cognitiveLevel: 'deep', learningObjectiveId: 'scale-cosine-comparison',
      eyebrow: '深度对比', prompt: '若先把每个 Q、K 向量严格归一化为单位范数，再做点积，与标准缩放点积相比最关键的差异是？',
      choices: ['单位范数点积移除了向量模长信息，而 1/√dₖ 只做全局尺度校正', '两者仅在 Q、K 范数都等于 dₖ 时等价', '单位范数点积保留模长，只调整维度尺度', '标准缩放与单位范数化都把点积限制在 [−1,1]'], correctChoiceId: 'a',
      explanation: '余弦式点积只保留方向；标准缩放不归一化每个向量，因此仍允许模长影响 Logit，也不保证值域在 [−1,1]。',
      coveredPoints: ['区分向量归一化与维度缩放'], keywords: ['logit'], practiceKind: 'boundary',
    }),
    recallQuestion({
      id: 'scaled-dot-product-12', cognitiveLevel: 'deep', learningObjectiveId: 'scale-interview-derivation',
      eyebrow: '口述 · 推导', prompt: '面试官追问“为什么是 √dₖ 而不是 dₖ”。请从统计假设、Softmax 行为和结论边界完整回答。',
      referencePoints: ['最低充分答案：在独立、零均值、单位方差近似下，点积方差约 dₖ、标准差约 √dₖ，并联系 Softmax 饱和', '满分补充：说明真实 Q/K 可能相关且尺度变化，结论是稳定化动机而非严格恒等式', '部分得分：知道缩放缓解大 Logit，但不能区分方差 dₖ 与标准差 √dₖ', '关键误区：声称点积方差为 √dₖ，或认为缩放降低 L² 复杂度'],
      explanation: '评分建议：推导出方差与标准差并连接 Softmax 才达到合格；遗漏统计假设可给合格但非满分。混淆方差和标准差时不得判为完整掌握。',
      coveredPoints: ['缩放点积的完整推导与边界'], keywords: ['logit', 'saturation'], practiceKind: 'oral',
    }),
  ],
});
