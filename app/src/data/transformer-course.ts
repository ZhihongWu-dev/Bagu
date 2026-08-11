import type {
  Choice,
  CourseSection,
  Exercise,
  KnowledgeKeyword,
  Lesson,
  MultipleChoiceExercise,
  OrderingExercise,
  SelfRecallExercise,
  SingleChoiceExercise,
} from '@/types/course';

export const keywords: Record<string, KnowledgeKeyword> = {
  logit: { id: 'logit', label: 'Logit', definition: '模型在归一化之前输出的原始分数。', intuition: '相对大小决定 Softmax 后的概率分布。', formula: 'pᵢ = exp(zᵢ) / Σ exp(zⱼ)' },
  saturation: { id: 'saturation', label: 'Softmax 饱和', definition: '输出概率非常接近 0 或 1，局部斜率变小。', intuition: '过大的注意力分数差距会削弱反向传播梯度。', formula: '∂softmax / ∂z → 0' },
  query: { id: 'query', label: 'Query', definition: '当前 token 主动寻找相关信息时使用的查询表示。', intuition: 'Query 是当前 token 提出的问题。', formula: 'Q = XWQ' },
  head: { id: 'head', label: 'Attention Head', definition: '一组独立的 Q、K、V 投影与注意力计算。', intuition: '不同头可以捕捉不同类型的关系。', formula: 'headᵢ = Attention(QWᵢQ, KWᵢK, VWᵢV)' },
  mask: { id: 'mask', label: 'Causal Mask', definition: '阻止当前位置看到未来 token 的上三角遮罩。', intuition: '生成第 t 个 token 时不能偷看答案。', formula: 'softmax(S + M), Mᵢⱼ=-∞ (j>i)' },
  residual: { id: 'residual', label: '残差连接', definition: '把子层输入直接加到子层输出。', intuition: '给信息和梯度保留一条高速通道。', formula: 'y = x + F(x)' },
  rope: { id: 'rope', label: 'RoPE', definition: '对 Q、K 按位置施加二维旋转的位置编码。', intuition: '内积自然携带相对位移信息。', formula: 'qₘᵀkₙ = qᵀR(n-m)k' },
  cache: { id: 'cache', label: 'KV Cache', definition: '缓存历史 token 在每层已经算出的 Key 与 Value。', intuition: '生成新 token 时不再重算全部历史表示。' },
  flash: { id: 'flash', label: 'FlashAttention', definition: '通过分块和在线 Softmax 减少注意力的显存读写。', intuition: '不近似注意力结果，主要优化 IO。' },
};

type Shared = {
  id: string;
  eyebrow: string;
  prompt: string;
  explanation: string;
  coveredPoints: string[];
  missingPoint?: string;
  keywords?: string[];
  formula?: string;
};

const makeChoices = (labels: string[]): Choice[] => labels.map((label, index) => ({ id: String.fromCharCode(97 + index), label }));

function single(shared: Shared, labels: string[], correctIndex: number): SingleChoiceExercise {
  return { ...shared, type: 'single-choice', keywords: shared.keywords ?? [], choices: makeChoices(labels), correctChoiceId: String.fromCharCode(97 + correctIndex) };
}

function multi(shared: Shared, labels: string[], correctIndexes: number[]): MultipleChoiceExercise {
  return { ...shared, type: 'multiple-choice', keywords: shared.keywords ?? [], choices: makeChoices(labels), correctChoiceIds: correctIndexes.map((index) => String.fromCharCode(97 + index)) };
}

function order(shared: Shared, steps: string[]): OrderingExercise {
  const displayOrder = steps.length === 4 ? [2, 0, 3, 1] : steps.map((_, index) => index).reverse();
  const choices = displayOrder.map((stepIndex, index) => ({ id: String.fromCharCode(97 + index), label: steps[stepIndex] }));
  const correctOrder = steps.map((step) => choices.find((choice) => choice.label === step)!.id);
  return { ...shared, type: 'ordering', keywords: shared.keywords ?? [], choices, correctOrder };
}

function recall(shared: Shared, referencePoints: string[]): SelfRecallExercise {
  return { ...shared, type: 'self-recall', keywords: shared.keywords ?? [], referencePoints };
}

const lesson = (id: string, title: string, shortTitle: string, subtitle: string, icon: string, exercises: Exercise[]): Lesson => ({
  id, title, shortTitle, subtitle, icon, duration: 8, exercises,
});

const qkv = lesson('qkv', 'Q、K、V 与注意力分数', 'Q · K · V', '理解信息检索、匹配与聚合', 'Q', [
  single({ id: 'qkv-1', eyebrow: '单选', prompt: '在 Self-Attention 中，Query 最接近哪种含义？', explanation: 'Query 表示当前 token 的信息需求，Key 用于匹配，Value 携带被聚合的内容。', coveredPoints: ['Query 发起匹配', 'Key 表示可匹配特征'], missingPoint: 'Value 承载聚合信息', keywords: ['query'] }, ['当前 token 的信息需求', '最终输出概率', '绝对位置编号', '词表中的 token id'], 0),
  multi({ id: 'qkv-2', eyebrow: '多选', prompt: '关于 Q、K、V，哪些说法正确？', explanation: '三者通常由同一输入经过不同可学习投影得到，QK 决定权重，V 被加权求和。', coveredPoints: ['独立线性投影', 'QK 负责匹配', 'V 负责内容'] }, ['Q、K、V 通常使用不同投影矩阵', '注意力权重由 Q 与 K 的相似度产生', 'V 决定 Softmax 的归一化维度', '输出是对 V 的加权和'], [0, 1, 3]),
  order({ id: 'qkv-3', eyebrow: '排序', prompt: '按一次注意力计算的顺序排列。', explanation: '先投影 Q/K/V，再计算并缩放分数，随后 Softmax，最后聚合 V。', coveredPoints: ['先匹配后聚合'] }, ['生成 Q、K、V', '计算并缩放 QKᵀ', '对分数做 Softmax', '使用权重加权 V']),
  recall({ id: 'qkv-4', eyebrow: '口述', prompt: '用 30 秒解释：为什么不能只使用一个投影同时充当 Q、K、V？', explanation: '不同投影允许“我要找什么”“我能被怎样匹配”“我携带什么内容”分别学习，提升表达能力。', coveredPoints: ['角色解耦', '独立表示子空间', '匹配与内容分离'] }, ['Q、K、V 的职责不同', '独立投影提供不同子空间', '权重计算与内容聚合需要分离']),
]);

const scaled = lesson('scaled-dot-product', '缩放点积与注意力 Mask', '缩放与 Mask', '掌握稳定训练和因果约束', '√', [
  single({ id: 'scale-1', eyebrow: '单选', prompt: '为什么点积注意力要除以 √dₖ？', formula: 'softmax(QKᵀ / √dₖ)V', explanation: '点积方差随 dₖ 增长，缩放能避免 Logit 过大导致 Softmax 饱和。', coveredPoints: ['控制点积方差', '缓解 Softmax 饱和'], keywords: ['logit', 'saturation'] }, ['减少参数量', '稳定分数尺度与梯度', '注入位置信息', '消除注意力复杂度'], 1),
  multi({ id: 'scale-2', eyebrow: '多选', prompt: '哪些 Mask 常用于 Transformer？', explanation: 'Padding Mask 排除补齐位置，Causal Mask 阻止看见未来，两者可以组合。', coveredPoints: ['Padding Mask', 'Causal Mask'], keywords: ['mask'] }, ['Padding Mask', 'Causal Mask', 'Dropout Mask 等同于因果 Mask', '两种 Mask 可以同时使用'], [0, 1, 3]),
  order({ id: 'scale-3', eyebrow: '排序', prompt: '排列带 Mask 的注意力分数处理流程。', explanation: 'Mask 要在 Softmax 前加入，使被遮挡位置归一化后接近 0。', coveredPoints: ['Mask 位于 Softmax 前'], keywords: ['mask'] }, ['计算 QKᵀ', '除以 √dₖ', '加入 Mask', '执行 Softmax']),
  recall({ id: 'scale-4', eyebrow: '口述', prompt: '解释：为什么 Causal Mask 通常填 −∞ 而不是 0？', explanation: 'Softmax 前填 0 仍会得到正概率；填极小值后指数趋近 0，才能真正排除未来位置。', coveredPoints: ['Softmax 输入', 'exp(−∞)=0', '阻止信息泄漏'], keywords: ['mask'] }, ['0 仍会参与 Softmax', '极小值指数后趋近 0', '避免未来 token 信息泄漏']),
]);

const multiHead = lesson('multi-head', '多头注意力', '多头注意力', '在多个表示子空间并行建模', 'M', [
  single({ id: 'mha-1', eyebrow: '单选', prompt: '多头注意力最核心的优势是什么？', explanation: '不同头拥有独立投影，可在不同表示子空间关注不同关系。', coveredPoints: ['独立投影', '多子空间'], keywords: ['head'] }, ['完全消除平方复杂度', '并行学习多种关系', '不再需要位置编码', '让参数量固定为零'], 1),
  multi({ id: 'mha-2', eyebrow: '多选', prompt: '总隐藏维度固定时，多头拆分会发生什么？', explanation: '常见实现令每头维度 d_model/h，各头拼接后回到 d_model。', coveredPoints: ['头维度缩小', '输出拼接', '再经 Wᴼ'], keywords: ['head'] }, ['每头维度通常变小', '各头输出会拼接', '头数越多一定越好', '拼接后通常还有输出投影'], [0, 1, 3]),
  order({ id: 'mha-3', eyebrow: '排序', prompt: '排列 Multi-Head Attention 的计算步骤。', explanation: '先按头投影并分别计算注意力，再拼接，最后做输出投影。', coveredPoints: ['分头计算', '拼接融合'], keywords: ['head'] }, ['生成每个头的 Q/K/V', '各头独立计算 Attention', '拼接所有头输出', '通过 Wᴼ 投影']),
  recall({ id: 'mha-4', eyebrow: '口述', prompt: '为什么注意力头数不能无限增加？', explanation: '隐藏维度固定时，头越多则单头维度越小，表达能力可能不足，还会增加调度与通信开销。', coveredPoints: ['单头维度下降', '表达瓶颈', '工程开销'] }, ['单头维度会被压缩', '过小头维度限制表达', '更多头带来额外调度开销']),
]);

const block = lesson('transformer-block', '残差、LayerNorm 与 FFN', 'Transformer 块', '理解注意力之外的关键结构', 'B', [
  single({ id: 'block-1', eyebrow: '单选', prompt: 'Transformer 中 FFN 的主要作用是什么？', explanation: 'Attention 在 token 间混合信息，FFN 对每个位置独立进行非线性特征变换。', coveredPoints: ['逐位置计算', '非线性变换'] }, ['跨 token 聚合信息', '逐 token 扩维、激活再投影', '生成因果 Mask', '替代所有注意力头'], 1),
  multi({ id: 'block-2', eyebrow: '多选', prompt: '残差连接和 LayerNorm 带来哪些作用？', explanation: '残差保留信息与梯度通路，LayerNorm 稳定单样本特征尺度。', coveredPoints: ['梯度通路', '尺度稳定'], keywords: ['residual'] }, ['缓解深层网络优化困难', '让梯度有直接通路', '彻底消除过拟合', 'LayerNorm 不依赖 batch 统计'], [0, 1, 3]),
  order({ id: 'block-3', eyebrow: '排序', prompt: '按典型 Pre-LN Transformer 子层顺序排列。', explanation: 'Pre-LN 先归一化，再执行子层和残差；注意力子层后接 FFN 子层。', coveredPoints: ['Pre-LN', '两次残差'], keywords: ['residual'] }, ['LayerNorm 后执行 Attention', '加入第一次残差', 'LayerNorm 后执行 FFN', '加入第二次残差']),
  recall({ id: 'block-4', eyebrow: '口述', prompt: '比较 Pre-LN 与 Post-LN 的训练差异。', explanation: 'Pre-LN 的梯度通路更直接，深层训练通常更稳定；Post-LN 原论文采用，但常需要更谨慎的 warmup。', coveredPoints: ['归一化位置', '训练稳定性', '深层梯度'] }, ['Pre-LN 在子层前归一化', 'Pre-LN 深层训练通常更稳定', 'Post-LN 对优化策略更敏感']),
]);

const position = lesson('position-encoding', '位置编码基础', '位置编码', '为无序的注意力注入顺序', 'P', [
  single({ id: 'pos-1', eyebrow: '单选', prompt: 'Transformer 为什么需要显式位置编码？', explanation: 'Self-Attention 本身对输入排列等变，没有天然的先后顺序偏置。', coveredPoints: ['排列等变', '显式顺序信息'] }, ['注意力完全不能并行', 'Self-Attention 不自带顺序', '词向量没有维度', 'Softmax 不能求导'], 1),
  multi({ id: 'pos-2', eyebrow: '多选', prompt: '正弦位置编码有哪些特点？', explanation: '它无需学习参数，不同频率表示位置，并允许相对位移通过线性关系表达。', coveredPoints: ['固定函数', '多频率', '一定外推能力'] }, ['无需学习位置参数', '使用不同频率的正弦余弦', '保证任意长度都完美外推', '相对位移可由线性变换表达'], [0, 1, 3]),
  order({ id: 'pos-3', eyebrow: '排序', prompt: '排列绝对位置编码进入模型的流程。', explanation: '先获得 token 与位置表示，相加后送入多层 Transformer，最后产生上下文化表示。', coveredPoints: ['输入阶段注入位置'] }, ['查找 token embedding', '生成 position embedding', '两者相加', '输入 Transformer 层']),
  recall({ id: 'pos-4', eyebrow: '口述', prompt: '解释绝对位置和相对位置编码的区别。', explanation: '绝对方案标记每个位置本身；相对方案直接影响 token 对之间的距离关系，通常更适合长上下文。', coveredPoints: ['位置本身', '位置差', '长上下文'] }, ['绝对位置描述索引', '相对位置描述 token 间距离', '相对方案通常更利于长度泛化']),
]);

const rope = lesson('rope-context', 'RoPE、ALiBi 与长度外推', '长上下文', '理解相对位置与外推限制', 'R', [
  single({ id: 'rope-1', eyebrow: '单选', prompt: 'RoPE 把位置信息作用在哪里？', explanation: 'RoPE 对每层注意力中的 Q、K 施加随位置变化的旋转，使内积携带相对位移。', coveredPoints: ['作用于 Q/K', '旋转变换'], keywords: ['rope'] }, ['只作用于 Value', '作用于 Query 和 Key', '只修改词表', '作用于损失标签'], 1),
  multi({ id: 'rope-2', eyebrow: '多选', prompt: '长上下文扩展通常需要考虑哪些问题？', explanation: '位置频率、训练长度分布、注意力计算/显存和有效利用能力都影响扩展。', coveredPoints: ['位置外推', '计算成本', '训练分布'] }, ['RoPE 频率缩放', '训练长度与测试长度差异', '序列越长注意力成本越低', '模型是否真正利用远距离信息'], [0, 1, 3]),
  order({ id: 'rope-3', eyebrow: '排序', prompt: '排列 RoPE 参与注意力的流程。', explanation: 'Q/K 先投影，再按位置旋转，随后计算内积并做 Softmax。', coveredPoints: ['投影后旋转'], keywords: ['rope'] }, ['线性投影得到 Q/K', '按各自位置旋转', '计算旋转后的 QKᵀ', '缩放并执行 Softmax']),
  recall({ id: 'rope-4', eyebrow: '口述', prompt: '比较 RoPE 与 ALiBi 的核心思路。', explanation: 'RoPE 旋转 Q/K 表示相对位置；ALiBi 直接给注意力分数加入与距离成比例的偏置。', coveredPoints: ['旋转表示', '线性距离偏置', '外推方式'] }, ['RoPE 修改 Q/K', 'ALiBi 修改注意力分数', '两者都强调相对距离']),
]);

const encdec = lesson('encoder-decoder', 'Encoder、Decoder 与交叉注意力', '编码器与解码器', '区分三种主流架构', 'E', [
  single({ id: 'arch-1', eyebrow: '单选', prompt: 'Encoder-Decoder 中交叉注意力的 K、V 来自哪里？', explanation: 'Decoder 提供 Query，Encoder 输出提供 Key 和 Value。', coveredPoints: ['Q 来自 Decoder', 'K/V 来自 Encoder'] }, ['全部来自 Decoder', 'Q 来自 Encoder，K/V 来自 Decoder', 'Q 来自 Decoder，K/V 来自 Encoder', '全部来自词表矩阵'], 2),
  multi({ id: 'arch-2', eyebrow: '多选', prompt: '哪些架构对应关系正确？', explanation: 'BERT 是 Encoder-only，GPT 是 Decoder-only，T5 是 Encoder-Decoder。', coveredPoints: ['BERT', 'GPT', 'T5'] }, ['BERT：Encoder-only', 'GPT：Decoder-only', 'T5：Encoder-Decoder', 'GPT：必须使用双向注意力'], [0, 1, 2]),
  order({ id: 'arch-3', eyebrow: '排序', prompt: '排列 Encoder-Decoder 生成流程。', explanation: '源序列先编码，Decoder 读取已生成前缀并交叉关注 Encoder，最后预测下一个 token。', coveredPoints: ['先编码后解码'] }, ['Encoder 处理源序列', 'Decoder 读取目标前缀', '交叉注意力读取 Encoder 输出', '预测下一个目标 token']),
  recall({ id: 'arch-4', eyebrow: '口述', prompt: '什么任务更适合 Encoder-Decoder？为什么？', explanation: '翻译、摘要等输入到输出的条件生成任务适合先完整编码输入，再由 Decoder 自回归生成。', coveredPoints: ['条件生成', '完整输入表示', '自回归输出'] }, ['适合翻译/摘要等 seq2seq', 'Encoder 双向理解输入', 'Decoder 条件生成输出']),
]);

const bertgpt = lesson('bert-gpt', 'BERT、GPT 与训练目标', 'BERT vs GPT', '从 Mask 到建模目标理解差异', 'G', [
  single({ id: 'bg-1', eyebrow: '单选', prompt: 'BERT 的 MLM 与 GPT 的 CLM 最大差别是什么？', explanation: 'MLM 利用双向上下文预测被遮挡 token；CLM 只能使用左侧历史预测下一个 token。', coveredPoints: ['双向 MLM', '单向 CLM'] }, ['是否使用梯度', '可见上下文方向', '是否需要词表', '是否使用矩阵乘法'], 1),
  multi({ id: 'bg-2', eyebrow: '多选', prompt: '关于 Teacher Forcing，哪些说法正确？', explanation: '训练时把真实前缀作为输入，可并行计算各位置损失；推理时输入来自模型自身输出。', coveredPoints: ['真实前缀', '训练并行', '暴露偏差'] }, ['训练使用真实历史 token', '推理使用模型生成历史', '会带来训练—推理分布差异', '让自回归推理完全并行'], [0, 1, 2]),
  order({ id: 'bg-3', eyebrow: '排序', prompt: '排列自回归语言模型一次训练前向过程。', explanation: '输入右移后施加因果约束，模型输出 logits，最后与真实下一个 token 计算交叉熵。', coveredPoints: ['右移输入', '因果约束', '下一个 token 损失'] }, ['构造右移后的输入', '应用 Causal Mask', '输出每个位置 logits', '计算 next-token 交叉熵']),
  recall({ id: 'bg-4', eyebrow: '口述', prompt: '为什么 GPT 更自然地适合开放式生成？', explanation: '其训练目标与推理过程一致，都是根据历史前缀逐 token 预测后续内容。', coveredPoints: ['训练目标一致', '自回归分解', '开放式续写'] }, ['训练和推理都做 next-token prediction', '概率可自回归分解', '天然支持任意长度续写']),
]);

const cache = lesson('kv-cache', 'KV Cache 与解码阶段', 'KV Cache', '理解 Prefill、Decode 和显存瓶颈', 'K', [
  single({ id: 'cache-1', eyebrow: '单选', prompt: '自回归 Decode 时为什么只缓存 K、V？', explanation: '新一步只需要新 token 的 Query 去查询全部历史 K/V；历史 Query 不再被使用。', coveredPoints: ['新 Q 查询历史', '历史 K/V 可复用'], keywords: ['cache'] }, ['历史 Query 会被反复查询', '历史 K/V 在后续步骤保持不变', 'Value 不参与输出', '缓存会降低显存使用'], 1),
  multi({ id: 'cache-2', eyebrow: '多选', prompt: 'KV Cache 大小受哪些因素影响？', explanation: '它随层数、序列长度、batch、KV 头数和头维度增长。', coveredPoints: ['层数', '序列长度', 'KV 头数'] }, ['模型层数', '上下文长度', 'KV 头数量', '只与词表大小有关'], [0, 1, 2]),
  order({ id: 'cache-3', eyebrow: '排序', prompt: '排列一次带 KV Cache 的生成流程。', explanation: 'Prefill 建缓存，Decode 新 token 只算新 K/V 并追加，然后计算分布并采样。', coveredPoints: ['Prefill', '追加缓存', '逐 token Decode'], keywords: ['cache'] }, ['Prefill 处理完整提示词', '缓存每层历史 K/V', '新 token 计算并追加 K/V', '计算并采样下一个 token']),
  recall({ id: 'cache-4', eyebrow: '口述', prompt: '比较 Prefill 和 Decode 的硬件特征。', explanation: 'Prefill 处理大量 token，矩阵乘法大且更偏计算密集；Decode 每步 token 少、频繁读 KV Cache，更偏内存带宽。', coveredPoints: ['Prefill 计算密集', 'Decode 带宽敏感', '批处理差异'] }, ['Prefill 并行处理提示词', 'Decode 一次通常只有一个新 token', 'Decode 经常受显存带宽限制']),
]);

const efficient = lesson('efficient-attention', 'MQA、GQA 与 FlashAttention', '高效注意力', '区分容量、缓存与 IO 优化', 'F', [
  single({ id: 'eff-1', eyebrow: '单选', prompt: 'GQA 相比标准 MHA 主要减少了什么？', explanation: '多个 Query 头共享较少的 K/V 头，从而减少 KV Cache 和内存带宽。', coveredPoints: ['共享 K/V', '减少缓存'] }, ['Query 头数量必须变成 1', 'KV 头数量与缓存', '模型层数', '词表大小'], 1),
  multi({ id: 'eff-2', eyebrow: '多选', prompt: '关于 FlashAttention，哪些说法正确？', explanation: '它是精确注意力算法，通过分块、重计算和在线 Softmax 减少 HBM 读写。', coveredPoints: ['精确结果', '分块', 'IO 优化'], keywords: ['flash'] }, ['不近似注意力结果', '避免显式存储完整注意力矩阵', '主要优化显存 IO', '把复杂度严格降为线性'], [0, 1, 2]),
  order({ id: 'eff-3', eyebrow: '排序', prompt: '按 KV 共享程度从低到高排列。', explanation: 'MHA 每个 Q 头有独立 K/V；GQA 分组共享；MQA 所有 Q 头共享一组 K/V。', coveredPoints: ['MHA', 'GQA', 'MQA'] }, ['MHA：每头独立 K/V', 'GQA：组内共享 K/V', 'MQA：所有 Q 头共享 K/V']),
  recall({ id: 'eff-4', eyebrow: '口述', prompt: '比较 GQA 与 FlashAttention：它们分别解决什么瓶颈？', explanation: 'GQA 减少推理阶段 KV Cache；FlashAttention 优化训练和推理中的注意力 IO，两者可以同时使用。', coveredPoints: ['GQA 减缓存', 'FlashAttention 减 IO', '两者可组合'] }, ['GQA 改变 KV 头结构', 'FlashAttention 改变计算实现', '结构优化和内核优化可以叠加']),
]);

export const transformerSection: CourseSection = {
  id: 'transformer-foundations',
  title: 'Transformer 完整学习之路',
  subtitle: '从 Attention 到高效推理',
  units: [
    { id: 'attention-basics', title: 'Unit 1 · Attention 基础', shortTitle: 'Attention 基础', description: 'Q/K/V、缩放点积与 Mask', color: '#6C52E5', darkColor: '#5138BD', softColor: '#EEE9FF', lessons: [qkv, scaled] },
    { id: 'transformer-blocks', title: 'Unit 2 · Transformer 结构', shortTitle: 'Transformer 结构', description: '多头、残差、归一化与 FFN', color: '#1F9D7A', darkColor: '#16856B', softColor: '#E7FAF4', lessons: [multiHead, block] },
    { id: 'position-context', title: 'Unit 3 · 位置与长上下文', shortTitle: '位置与长上下文', description: '位置编码、RoPE 与长度外推', color: '#D68100', darkColor: '#A86500', softColor: '#FFF0C6', lessons: [position, rope] },
    { id: 'model-architectures', title: 'Unit 4 · 模型架构', shortTitle: '模型架构', description: 'Encoder、Decoder、BERT 与 GPT', color: '#2777C7', darkColor: '#195B99', softColor: '#EAF4FF', lessons: [encdec, bertgpt] },
    { id: 'inference-efficiency', title: 'Unit 5 · 推理与优化', shortTitle: '推理与优化', description: 'KV Cache、GQA 与 FlashAttention', color: '#8A55B5', darkColor: '#643987', softColor: '#F4EAFE', lessons: [cache, efficient] },
  ],
};

export const transformerLessons = transformerSection.units.flatMap((unit) => unit.lessons);
