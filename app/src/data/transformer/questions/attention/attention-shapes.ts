import { buildExplicitQuestionNode, multipleQuestion, orderingQuestion, recallQuestion, singleQuestion } from '../../question-builders';

// Shape conventions follow the scaled dot-product attention definition in Vaswani et al.
export const attentionShapesNode = buildExplicitQuestionNode({
  id: 'attention-shapes', title: 'Attention 的张量形状', shortTitle: '张量形状', subtitle: '从维度推导每一步',
  icon: 'grid', knowledgeIds: ['attention-shapes'],
  exercises: [
    singleQuestion({
      id: 'attention-shapes-01', cognitiveLevel: 'foundation', learningObjectiveId: 'shape-score-matrix',
      eyebrow: '形状判断', prompt: '忽略 batch 和 head 维，Q 的形状为 Lq×Dh，K 的形状为 Lk×Dh。QKᵀ 的形状是什么？',
      choices: ['Lq×Lk', 'Lk×Lq', 'Dh×Lk', 'Lq×Dh'], correctChoiceId: 'a',
      explanation: 'Q 的最后一维 Dh 与 Kᵀ 的第一维 Dh 收缩，保留 Query 长度 Lq 与 Key 长度 Lk。',
      coveredPoints: ['由矩阵乘法推出分数矩阵形状'], keywords: ['query'], practiceKind: 'mechanism',
    }),
    singleQuestion({
      id: 'attention-shapes-02', cognitiveLevel: 'foundation', learningObjectiveId: 'shape-attention-output',
      eyebrow: '形状判断', prompt: '注意力权重形状为 Lq×Lk，V 的形状为 Lk×Dv。加权结果的形状是什么？',
      choices: ['Lq×Dv', 'Lk×Dv', 'Lq×Lk', 'Lk×Lq'], correctChoiceId: 'a',
      explanation: '权重的 Key 轴 Lk 与 V 的位置轴 Lk 收缩，输出为每个 Query 生成一个 Dv 维上下文。',
      coveredPoints: ['输出沿用 Query 长度'], keywords: ['query'], practiceKind: 'mechanism',
    }),
    multipleQuestion({
      id: 'attention-shapes-03', cognitiveLevel: 'foundation', learningObjectiveId: 'shape-axis-semantics',
      eyebrow: '多选 · 轴语义', prompt: '对分数张量 [B,H,Lq,Lk]，哪些解释正确？',
      choices: ['B 是批大小', 'H 表示 K/V 来源序列的数量，而非注意力头数', 'Lq 轴索引发起查询的位置', 'Lk 在 Self-Attention 中必须与 Lq 相等，因此不能表示缓存长度'], correctChoiceIds: ['a', 'c'],
      explanation: 'B 是批大小，H 是注意力头数，最后两轴分别索引 Query 与 Key 位置。普通整段 Self-Attention 常有 Lq=Lk，但使用 KV Cache 时可不相等。',
      coveredPoints: ['理解 B、H、Lq、Lk 的语义'], keywords: ['query'], practiceKind: 'concept',
    }),
    singleQuestion({
      id: 'attention-shapes-04', cognitiveLevel: 'application', learningObjectiveId: 'shape-cross-attention',
      eyebrow: '场景题', prompt: 'Decoder 有 32 个 Query 位置，Encoder 提供 128 个 Key/Value 位置，每头维度为 64。单头分数矩阵的形状是？',
      choices: ['32×128', '128×32', '32×64', '64×128'], correctChoiceId: 'a',
      explanation: '每个 Decoder Query 都要对 128 个 Encoder Key 打分，因此两个位置轴为 32×128；头维在内积中被消去。',
      coveredPoints: ['Cross-Attention 中不同序列长度的形状'], keywords: ['query'], practiceKind: 'scenario',
    }),
    orderingQuestion({
      id: 'attention-shapes-05', cognitiveLevel: 'application', learningObjectiveId: 'shape-multihead-flow',
      eyebrow: '排序 · 变形', prompt: '将 [B,L,Dmodel] 输入用于 H 头注意力时，按典型实现顺序排列。',
      choices: [
        { id: 'a', label: '在头维上计算注意力' },
        { id: 'b', label: '线性投影得到 Q、K、V' },
        { id: 'c', label: '把 H 个头的输出拼接回隐藏维' },
        { id: 'd', label: '重排为 [B,H,L,Dh]' },
      ], correctOrder: ['b', 'd', 'a', 'c'],
      explanation: '先投影，再拆头和换轴；每个头独立计算后拼接。拆头本身不增加总隐藏维 Dmodel=H×Dh。',
      coveredPoints: ['多头注意力的形状变换流程'], keywords: ['head'], practiceKind: 'mechanism',
    }),
    singleQuestion({
      id: 'attention-shapes-06', cognitiveLevel: 'application', learningObjectiveId: 'shape-debug-transpose',
      eyebrow: '排障题', prompt: 'Q、K 都是 [B,H,L,Dh]，直接做 Q@K 报内维不匹配。最可能漏了什么？',
      choices: ['交换 K 的最后两个维度', '交换 Q 的最后两个维度后计算 K@Q', '把 K reshape 为 [B,H,L×Dh,1]', '在 Q 与 K 之间插入长度为 L 的对角矩阵'], correctChoiceId: 'a',
      explanation: '需要 Kᵀ 形状 [B,H,Dh,L]，才能让 Q 的 Dh 与 Kᵀ 的 Dh 收缩。其他操作不符合点积注意力的轴语义。',
      coveredPoints: ['识别 K 转置的目的'], keywords: ['head'], practiceKind: 'troubleshooting',
    }),
    multipleQuestion({
      id: 'attention-shapes-07', cognitiveLevel: 'application', learningObjectiveId: 'shape-valid-cross-configurations',
      eyebrow: '多选 · 兼容性', prompt: '要计算 A=softmax(QKᵀ)V，哪些维度约束是必须的？',
      choices: ['Q 与 K 的点积维相同', 'K 与 V 的位置长度相同', 'Q 与 V 的特征维必须相同', '输出的位置长度等于 Q 的位置长度'], correctChoiceIds: ['a', 'b', 'd'],
      explanation: 'Q/K 需共享点积维，权重的 Key 轴需与 V 的位置轴对齐；Lq 与 Lk 无需相等，输出保留 Lq。',
      coveredPoints: ['注意力乘法的必要维度约束'], keywords: ['query'], practiceKind: 'boundary',
    }),
    singleQuestion({
      id: 'attention-shapes-08', cognitiveLevel: 'application', learningObjectiveId: 'shape-head-dimension',
      eyebrow: '工程题', prompt: 'Dmodel=768，使用 12 个等宽注意力头。每头 Dh 应是多少？',
      choices: ['64', '12', '72', '96'], correctChoiceId: 'a',
      explanation: '等宽拆分时 Dh=Dmodel/H=768/12=64。12 是头数本身；72 和 96 分别对应把 768 误除以其他常见头数，均不满足题设的 12 头。',
      coveredPoints: ['Dmodel、H 与 Dh 的关系'], keywords: ['head'], practiceKind: 'mechanism',
    }),
    singleQuestion({
      id: 'attention-shapes-09', cognitiveLevel: 'application', learningObjectiveId: 'shape-memory-driver',
      eyebrow: '性能判断', prompt: '固定 B、H 和 Dh，把 Self-Attention 序列长度从 L 增到 2L。若显式保存完整分数矩阵，其元素数量约变为多少倍？',
      choices: ['4 倍', '2 倍', '8 倍', '约 2 倍再加一个与 Dh 成正比的常数项'], correctChoiceId: 'a',
      explanation: '分数矩阵的两个位置轴都是 L，元素数与 L² 成正比；长度翻倍时变为 4 倍。',
      coveredPoints: ['从 [B,H,L,L] 推出二次内存增长'], keywords: ['head'], practiceKind: 'metrics',
    }),
    multipleQuestion({
      id: 'attention-shapes-10', cognitiveLevel: 'deep', learningObjectiveId: 'shape-broadcast-mask',
      eyebrow: '多选 · 广播', prompt: '分数张量为 [B,H,Lq,Lk]，且 B、H、Lq、Lk 可取任意不同值。哪些 Mask 形状既能广播又保持所述轴语义？',
      choices: ['[B,1,1,Lk] 的 Key Padding Mask', '[1,1,Lq,Lk] 的共享 Causal Mask', '[B,H,Lk,Lq] 的逐头 Mask 无需转置即可直接使用', '[B,Lq] 且默认与最后两轴自动对齐'], correctChoiceIds: ['a', 'b'],
      explanation: '前两种分别明确对齐 Key Padding 和共享 Query×Key 可见性。[B,H,Lk,Lq] 交换了位置轴；[B,Lq] 从尾部对齐也会错误匹配 Lk。',
      coveredPoints: ['按轴语义判断广播兼容性'], keywords: ['mask', 'head'], practiceKind: 'troubleshooting',
    }),
    singleQuestion({
      id: 'attention-shapes-11', cognitiveLevel: 'deep', learningObjectiveId: 'shape-grouped-query',
      eyebrow: '架构推理', prompt: '标准等组 Grouped-Query Attention 中，Q 有 Hq 个头，K/V 有 Hkv 个头。计算前最关键的头维兼容条件是什么？',
      choices: ['Hq 能被 Hkv 整除，每组 Query 头映射到一个 K/V 头，且点积维相同', 'Hkv 能被 Hq 整除，使每个 Query 头映射多个 K/V 头', '只要 Hq 与 Hkv 的乘积等于 Dmodel，二者可任意分组', '只需 Hq−Hkv 为偶数，框架即可通过广播完成共享'], correctChoiceId: 'a',
      explanation: '常见等组 GQA 要求 Hq mod Hkv=0，每个 K/V 头服务相同数量的 Query 头，同时 Q/K 的每头点积维必须一致。',
      coveredPoints: ['从形状理解 GQA 的头共享'], keywords: ['head', 'query'], practiceKind: 'boundary',
    }),
    recallQuestion({
      id: 'attention-shapes-12', cognitiveLevel: 'deep', learningObjectiveId: 'shape-whiteboard-derivation',
      eyebrow: '口述 · 白板', prompt: 'Query 源输入为 [B,Lq,Dmodel]，Key/Value 源输入为 [B,Lk,Dmodel]。口述多头 Cross-Attention 直到输出的完整形状链路。',
      referencePoints: ['最低充分答案：Q=[B,H,Lq,Dh]、K/V=[B,H,Lk,Dh/Dv]，推出分数 [B,H,Lq,Lk] 与输出 [B,H,Lq,Dv]', '满分补充：说明收缩 Dh 与 Lk，并正确拼头回 [B,Lq,H×Dv]（常见配置为 Dmodel）', '部分得分：最终形状正确但漏一个中间形状或未解释收缩轴', '关键误区：交换 Lq/Lk、要求 Cross-Attention 的 Lq=Lk，或拼头后仍保留独立 H 轴'],
      explanation: '评分建议：Q/K/V、分数、单头输出三段形状均正确才达到合格；漏写一个中间形状可记部分掌握。出现轴交换或错误拼头时不得判为完整。',
      coveredPoints: ['多头 Cross-Attention 完整形状推导'], keywords: ['head', 'query'], practiceKind: 'oral',
    }),
  ],
});
