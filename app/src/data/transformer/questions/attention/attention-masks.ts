import { buildExplicitQuestionNode, multipleQuestion, orderingQuestion, recallQuestion, singleQuestion } from '../../question-builders';

// Mask semantics follow causal decoder masking in Vaswani et al. and common SDPA APIs.
export const attentionMasksNode = buildExplicitQuestionNode({
  id: 'attention-masks', title: 'Padding 与 Causal Mask', shortTitle: 'Attention Mask', subtitle: '区分无效位置与未来信息',
  icon: 'mask', knowledgeIds: ['attention-mask'],
  exercises: [
    singleQuestion({
      id: 'attention-masks-01', cognitiveLevel: 'foundation', learningObjectiveId: 'mask-distinguish-purpose',
      eyebrow: '概念判断', prompt: '哪项准确区分 Padding Mask 与 Causal Mask？',
      choices: ['前者由样本有效长度决定，后者由自回归可见性决定', '前者限制 Query 轴，后者只限制 Key 轴', '前者对同批样本完全相同，后者随每条样本长度变化', '前者在 Softmax 前使用，后者只能在 Softmax 后使用'], correctChoiceId: 'a',
      explanation: 'Padding Mask 由样本有效长度决定；Causal Mask 由自回归可见性决定。二者目的不同但都限制可参与注意力的位置。',
      coveredPoints: ['区分两类 Mask 的目的'], keywords: ['mask'], practiceKind: 'concept',
    }),
    singleQuestion({
      id: 'attention-masks-02', cognitiveLevel: 'foundation', learningObjectiveId: 'mask-softmax-order',
      eyebrow: '流程判断', prompt: '采用加性 Mask 时，应在何时把禁止位置的 Logit 设为极小值？',
      choices: ['分数缩放后、Softmax 前', 'Softmax 后置零并对有效权重重新归一化', '对 Value 置零后再计算分数', 'QKᵀ 之前直接把被禁 Key 向量置零'], correctChoiceId: 'a',
      explanation: '加性 Mask 的定义就是在 Softmax 前修改 Logit。Softmax 后置零再重归一化在精确算术下可得到相同分布，但它不是题目所问的“加性 Mask 填 Logit”时机，且会产生不必要的中间概率。QKᵀ 前置零 Key 也不能保证其权重为零。',
      coveredPoints: ['Mask 应在 Softmax 前作用'], keywords: ['mask', 'logit'], practiceKind: 'mechanism',
    }),
    multipleQuestion({
      id: 'attention-masks-03', cognitiveLevel: 'foundation', learningObjectiveId: 'mask-properties',
      eyebrow: '多选 · 性质', prompt: '关于 Decoder 的标准 Causal Mask，哪些说法正确？',
      choices: ['位置 i 可关注不晚于 i 的位置', '允许区域通常呈下三角结构', '标准 Causal Mask 必须为每个头单独物化，不能跨头广播', '它与 Key Padding Mask 等价，因为二者都形成三角区域'], correctChoiceIds: ['a', 'b'],
      explanation: 'Causal Mask 由相对位置形成下三角可见区，标准共享可见性可以跨头广播，无需逐头物化；Padding Mask 由样本有效长度决定，二者不等价。',
      coveredPoints: ['Causal Mask 的可见区域与广播'], keywords: ['mask'], practiceKind: 'concept',
    }),
    orderingQuestion({
      id: 'attention-masks-04', cognitiveLevel: 'application', learningObjectiveId: 'mask-application-flow',
      eyebrow: '排序 · 实现', prompt: '在先生成布尔 Mask、再显式广播与填值的张量实现中，按处理顺序排列。',
      choices: [
        { id: 'a', label: '沿 Key 轴计算 Softmax' }, { id: 'b', label: '构造允许/禁止位置矩阵' },
        { id: 'c', label: '把 Mask 广播到分数张量' }, { id: 'd', label: '禁止位置填入极小 Logit' },
      ], correctOrder: ['b', 'c', 'd', 'a'],
      explanation: '先构造并对齐可见性，再修改归一化前 Logit，最终 Softmax 才会给禁止位置近零权重。',
      coveredPoints: ['加性 Mask 的完整实现顺序'], keywords: ['mask', 'logit'], practiceKind: 'mechanism',
    }),
    singleQuestion({
      id: 'attention-masks-05', cognitiveLevel: 'application', learningObjectiveId: 'mask-padding-batch',
      eyebrow: '场景题', prompt: '批内两条序列有效长度分别为 5 和 3，采用右侧补齐统一到长度 5。第二条序列的 Key Padding Mask 应额外排除哪些 Key 位置？',
      choices: ['排除第 4、5 个 Key 位置', '排除第 1、2 个 Key 位置', '只排除第 5 个 Key 位置', '只排除第 4、5 个 Query 位置'], correctChoiceId: 'a',
      explanation: '题干明确右侧补齐，第二条序列的前三个位置是真实 token，后两个 Key 位置不应被任何 Query 当作可检索内容。',
      coveredPoints: ['由有效长度构造 Key Padding Mask'], keywords: ['mask'], practiceKind: 'scenario',
    }),
    singleQuestion({
      id: 'attention-masks-06', cognitiveLevel: 'application', learningObjectiveId: 'mask-debug-post-softmax',
      eyebrow: '排障题', prompt: '实现先做 Softmax，再把未来位置权重乘 0，且不重新归一化。最直接的后果是？',
      choices: ['有效位置权重之和小于 1，输出尺度被改变', '结果与 Softmax 前屏蔽严格等价，因为被置零项不参与输出', '仅当未来位置原权重相等时，剩余权重和才小于 1', '有效位置相对比例会改变，但权重和仍保持 1'], correctChoiceId: 'a',
      explanation: '未来位置原先占有的概率质量被直接丢弃；没有重归一化时，剩余权重不再构成和为 1 的分布。',
      coveredPoints: ['解释 Softmax 后 Mask 的归一化缺陷'], keywords: ['mask', 'logit'], practiceKind: 'troubleshooting',
    }),
    multipleQuestion({
      id: 'attention-masks-07', cognitiveLevel: 'application', learningObjectiveId: 'mask-composition',
      eyebrow: '多选 · 组合', prompt: 'Decoder 自注意力同时存在 Padding 与 Causal 约束时，哪些处理合理？',
      choices: ['布尔表示中，可见条件应为“非 Padding 且满足因果边界”', '加性表示中，可把两种 Mask 的禁止项合并后一次填入极小值', '组合后只需沿 Query 轴归一化，因为 Key 可见性已处理', 'Causal Mask 不能从三角结构推断各样本的真实 Padding 位置'], correctChoiceIds: ['a', 'b', 'd'],
      explanation: '布尔 Mask 对允许条件做 AND（等价于禁止集合 OR）；加性实现可合并禁止位置后填极小值。无论如何仍沿 Key 轴做 Softmax，且 Causal Mask 不能替代样本相关的 Padding Mask。',
      coveredPoints: ['组合 Padding 与 Causal Mask'], keywords: ['mask'], practiceKind: 'mechanism',
    }),
    singleQuestion({
      id: 'attention-masks-08', cognitiveLevel: 'application', learningObjectiveId: 'mask-api-semantics',
      eyebrow: '工程边界', prompt: '把布尔 Attention Mask 从一个框架迁移到另一个框架时，哪项检查能同时防止可见性反转和轴错位？',
      choices: ['同时核对 True 的允许/禁止语义与 Mask 期望形状', '只核对布尔 Mask 最终使用的整数 dtype', '只核对目标 API 是否支持 is_causal 快捷参数', '只核对二维 Mask 是否存储为连续内存'], correctChoiceId: 'a',
      explanation: '不同 API 对布尔值的允许/禁止语义和广播形状可能相反；未经核对会静默反转可见性。',
      coveredPoints: ['跨框架核对布尔 Mask 语义'], keywords: ['mask'], practiceKind: 'boundary',
    }),
    singleQuestion({
      id: 'attention-masks-09', cognitiveLevel: 'application', learningObjectiveId: 'mask-cross-attention-padding',
      eyebrow: '迁移题', prompt: 'Encoder-Decoder Cross-Attention 中，Encoder 输入含 Padding。通常应沿分数矩阵的哪一轴排除这些位置？',
      choices: ['沿 Encoder 对应的 Key 轴 Lk 排除', '沿 Decoder 对应的 Query 轴 Lq 排除', '同时沿 Lq 与 Lk 排除相同索引', '先把 Encoder Padding 转为 Decoder Causal 对角线'], correctChoiceId: 'a',
      explanation: 'Encoder 表示在 Cross-Attention 中提供 K/V，因此其 Padding 对应 Key 位置轴；每个 Decoder Query 都应排除这些位置。',
      coveredPoints: ['Cross-Attention 中 Padding Mask 的轴'], keywords: ['mask', 'query'], practiceKind: 'scenario',
    }),
    multipleQuestion({
      id: 'attention-masks-10', cognitiveLevel: 'deep', learningObjectiveId: 'mask-fully-masked-row',
      eyebrow: '多选 · 数值边界', prompt: '如果某个 Query 的整行 Key 都被 Mask，哪些风险或处理是合理的？',
      choices: ['全为 −∞ 时减最大值可能产生 NaN', '需要定义该行输出策略或保证至少一个有效位置', '把 −∞ 换成 dtype 最小有限值即可在各种内核中保证输出精确为零', '只在 float32 下测试即可代表混合精度内核的行为'], correctChoiceIds: ['a', 'b'],
      explanation: '全遮挡行没有合法概率分布，朴素 Softmax 可能出现未定义运算，因此需定义策略或避免全遮挡。有限极小值不保证精确零，且混合精度必须单独测试。',
      coveredPoints: ['全遮挡行的数值风险与防护'], keywords: ['mask', 'logit'], practiceKind: 'troubleshooting',
    }),
    singleQuestion({
      id: 'attention-masks-11', cognitiveLevel: 'deep', learningObjectiveId: 'mask-cache-causal-offset',
      eyebrow: '推理题', prompt: '增量解码使用 KV Cache：缓存已有 100 个位置，本次一次加入 4 个新 Query。构造 Causal Mask 时容易忽略什么？',
      choices: ['新 Query 的绝对位置需包含 100 的缓存偏移', '只需构造局部 4×4 下三角 Mask，再广播到 4×104', '把 100 个缓存位置都视为未来位置，避免信息泄漏', '让四个新 Query 共享完全相同的 104 个可见 Key'], correctChoiceId: 'a',
      explanation: '新 Query 的因果边界基于全序列绝对位置；若只对 4×104 矩阵使用从零开始的局部三角形，会错误遮挡大量历史 Key。',
      coveredPoints: ['KV Cache 场景下 Causal Mask 的位置偏移'], keywords: ['mask', 'cache'], practiceKind: 'troubleshooting',
    }),
    recallQuestion({
      id: 'attention-masks-12', cognitiveLevel: 'deep', learningObjectiveId: 'mask-interview-debugging',
      eyebrow: '口述 · 追问', prompt: '从目的、形状、Softmax 顺序、API 布尔语义和全遮挡行五方面，说明如何正确实现并测试 Attention Mask。',
      referencePoints: ['最低充分答案：区分 Padding/Causal 目的，把 Mask 对齐到 [B,H,Lq,Lk] 并在 Softmax 前排除禁止位置', '满分补充：核对 API 的 True/False 语义，并为全遮挡行定义策略与混合精度测试', '部分得分：能描述三角 Mask，但未处理批内 Padding、广播或全遮挡行', '关键误区：Softmax 后直接置零且不重归一化，或认为 Causal Mask 能自动识别 Padding'],
      explanation: '评分建议：目的、轴和 Softmax 顺序是合格必答项；API 语义与全遮挡行决定是否完整。若保留任一关键误区，不得判为合格。',
      coveredPoints: ['Attention Mask 的完整工程检查表'], keywords: ['mask', 'logit'], practiceKind: 'oral',
    }),
  ],
});
