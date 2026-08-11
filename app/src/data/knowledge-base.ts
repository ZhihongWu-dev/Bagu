import type { KnowledgeCard, KnowledgeDomain } from '@/types/course';

import { expandedKnowledgeCards } from '@/data/knowledge-expansion';
import { transformerKnowledgeCards } from '@/data/transformer-knowledge';

export const knowledgeDomains: KnowledgeDomain[] = [
  { id: 'transformer', label: 'Transformer', shortLabel: 'Transformer', icon: 'T', color: '#6C52E5', softColor: '#EEE9FF' },
  { id: 'llm', label: '大模型与 NLP', shortLabel: 'LLM / NLP', icon: 'L', color: '#1F9D7A', softColor: '#E7FAF4' },
  { id: 'finetuning', label: '微调与对齐', shortLabel: '微调', icon: 'F', color: '#D68100', softColor: '#FFF0C6' },
  { id: 'loss', label: '损失函数', shortLabel: 'Loss', icon: '∑', color: '#D84E6B', softColor: '#FFF0F3' },
  { id: 'deep-learning', label: '深度学习基础', shortLabel: '深度学习', icon: 'D', color: '#2777C7', softColor: '#EAF4FF' },
  { id: 'reinforcement-learning', label: '强化学习', shortLabel: 'RL', icon: 'R', color: '#8A55B5', softColor: '#F4EAFE' },
];

const paper = (title: string, url: string) => ({ title, url, kind: 'paper' as const });
const docs = (title: string, url: string) => ({ title, url, kind: 'docs' as const });

const baseKnowledgeCards: KnowledgeCard[] = [
  {
    id: 'attention-scale', domainId: 'transformer', title: '为什么 Attention 要除以 √dₖ？', aliases: ['scaled dot product', '缩放点积'], difficulty: '高频',
    summary: '控制点积方差，避免 Softmax 饱和和梯度变小。',
    answer: '若 Q、K 各维独立且方差为 1，点积的方差会随 dₖ 增长。维度越大，logit 差距越容易被放大，Softmax 会趋近 one-hot，梯度随之变小。除以 √dₖ 后，点积方差被拉回稳定量级，训练更稳定。',
    intuition: '像把随着维度变大的音量自动调回正常范围，避免 Softmax 只听见最大的那个声音。', formula: 'Attention(Q,K,V)=softmax(QKᵀ/√dₖ)V',
    keyPoints: ['点积方差约为 dₖ', 'Softmax 饱和会削弱梯度', '缩放不改变 Q、K、V 的参数量'],
    followUps: ['为什么不是除以 dₖ？', '加性注意力是否需要同样缩放？'],
    sources: [paper('Attention Is All You Need', 'https://arxiv.org/abs/1706.03762')],
  },
  {
    id: 'multi-head', domainId: 'transformer', title: '多头注意力为什么有效？', aliases: ['MHA', 'Multi-Head Attention'], difficulty: '高频',
    summary: '多个低维子空间并行建模不同关系，再融合为统一表示。',
    answer: '每个头拥有独立的 Q、K、V 投影，因此可以在不同表示子空间学习句法、指代、位置等关系。各头输出拼接后再线性投影。总维度不变时，多头并不必然显著增加核心注意力计算量。',
    intuition: '同一句话交给几位各有专长的面试官观察，最后汇总判断。', formula: 'MultiHead(Q,K,V)=Concat(head₁,…,headₕ)Wᴼ',
    keyPoints: ['独立投影', '不同表示子空间', '拼接后经 Wᴼ 融合'],
    followUps: ['为什么头数不能无限增多？', 'MQA 和 GQA 改了什么？'],
    sources: [paper('Attention Is All You Need', 'https://arxiv.org/abs/1706.03762')],
  },
  {
    id: 'position-encoding', domainId: 'transformer', title: 'Transformer 为什么需要位置编码？', aliases: ['PE', 'RoPE', '位置嵌入'], difficulty: '基础',
    summary: 'Self-Attention 本身对输入排列等变，需要显式注入顺序。',
    answer: '纯 Self-Attention 只根据 token 间内容计算关系，若同时重排输入，输出也只会对应重排，无法区分先后。位置编码把绝对或相对位置信息加入表示。正弦编码可外推，RoPE 则把相对位置信息融入 Q、K 的旋转。',
    intuition: '词是演员，位置编码是剧本页码；只有演员名单无法知道出场顺序。',
    keyPoints: ['注意力本身没有顺序先验', '可学习与固定编码各有取舍', '长上下文常依赖相对位置方案'],
    followUps: ['RoPE 如何表达相对距离？', 'ALiBi 与 RoPE 有何区别？'],
    sources: [paper('Attention Is All You Need', 'https://arxiv.org/abs/1706.03762')],
  },
  {
    id: 'pretrain-objective', domainId: 'llm', title: '自回归语言模型在学什么？', aliases: ['next token prediction', 'CLM'], difficulty: '基础',
    summary: '根据历史 token 最大化下一个 token 的条件概率。',
    answer: '训练时模型最小化每个位置预测真实下一个 token 的交叉熵，等价于最大化整段文本的自回归似然。Teacher Forcing 让训练能并行，但推理必须逐 token 生成，因此会有训练与推理分布差异。',
    intuition: '不断做“看到前文后猜下一个词”的海量完形填空。', formula: 'L = -Σₜ log p(xₜ | x₍<t₎)',
    keyPoints: ['因果掩码', 'Teacher Forcing', '推理是自回归的'],
    followUps: ['它和 BERT 的 MLM 有何差异？', '曝光偏差是什么？'],
    sources: [paper('Language Models are Few-Shot Learners', 'https://arxiv.org/abs/2005.14165')],
  },
  {
    id: 'tokenization', domainId: 'llm', title: 'BPE 为什么适合大模型？', aliases: ['Tokenizer', '子词切分'], difficulty: '高频',
    summary: '在字符与整词之间折中词表大小、序列长度和未登录词问题。',
    answer: 'BPE 从基础字符开始，反复合并高频相邻片段。高频词可用较少 token，生僻词仍能拆成子词，因此几乎没有 OOV。代价是切分依赖语料，不同语言的 token 效率不一致，数字和空格也可能造成非直觉切分。',
    intuition: '常见积木预先粘成大块，罕见形状仍可用小积木拼出。',
    keyPoints: ['压缩序列长度', '开放词表', '切分质量影响成本与效果'],
    followUps: ['SentencePiece 解决了什么？', '词表越大一定越好吗？'],
    sources: [paper('Neural Machine Translation of Rare Words with Subword Units', 'https://arxiv.org/abs/1508.07909')],
  },
  {
    id: 'kv-cache', domainId: 'llm', title: 'KV Cache 为什么能加速推理？', aliases: ['推理缓存', 'prefill', 'decode'], difficulty: '高频',
    summary: '复用历史 token 已计算的 Key、Value，避免每步重复计算。',
    answer: '自回归解码第 t 步只新增一个 token。历史 token 在每层的 K、V 不会改变，因此可缓存并与新 Q 直接计算注意力。它显著减少重复算力，但缓存大小随层数、序列长度、头维度和 batch 增长，常成为显存瓶颈。',
    intuition: '写续集时保留前文索引，不必每写一个字都重读并重新做整本笔记。',
    keyPoints: ['只缓存 K、V', '时间换空间', 'Prefill 与 Decode 特征不同'],
    followUps: ['MQA/GQA 如何减少 KV Cache？', 'PagedAttention 解决什么问题？'],
    sources: [paper('Efficient Memory Management for Large Language Model Serving with PagedAttention', 'https://arxiv.org/abs/2309.06180')],
  },
  {
    id: 'lora', domainId: 'finetuning', title: 'LoRA 的原理是什么？', aliases: ['低秩适配', 'PEFT'], difficulty: '高频',
    summary: '冻结原权重，用两个低秩矩阵学习权重增量。',
    answer: 'LoRA 假设微调造成的权重更新具有较低内在秩，把 ΔW 参数化为 BA，其中秩 r 远小于原矩阵维度。训练时只更新 A、B，推理时可将增量合并回 W，因此显著减少可训练参数和优化器状态。',
    intuition: '不重写整本教材，只用一组小尺寸批注描述需要改变的方向。', formula: 'W′ = W + (α/r)BA',
    keyPoints: ['原权重冻结', '低秩更新', 'α/r 控制缩放'],
    followUps: ['rank 越大越好吗？', '通常把 LoRA 加在哪些层？'],
    sources: [paper('LoRA: Low-Rank Adaptation of Large Language Models', 'https://arxiv.org/abs/2106.09685')],
  },
  {
    id: 'qlora', domainId: 'finetuning', title: 'QLoRA 比 LoRA 多做了什么？', aliases: ['NF4', '4-bit fine-tuning'], difficulty: '进阶',
    summary: '把冻结基座量化到 4 bit，同时以较高精度训练 LoRA 适配器。',
    answer: 'QLoRA 将冻结的预训练权重量化为 4-bit NF4，梯度仍通过反量化后的计算流向 LoRA 参数。它还使用双重量化降低量化常数开销，并用分页优化器缓解显存峰值。量化的是基座存储，不代表所有计算都在 4 bit 完成。',
    intuition: '把只读教材压缩存放，但批注仍用清晰格式书写和训练。',
    keyPoints: ['NF4', '双重量化', '分页优化器'],
    followUps: ['为什么 NF4 适合正态分布权重？', '量化误差如何影响任务？'],
    sources: [paper('QLoRA: Efficient Finetuning of Quantized LLMs', 'https://arxiv.org/abs/2305.14314')],
  },
  {
    id: 'sft-vs-rlhf', domainId: 'finetuning', title: 'SFT 与 RLHF 分别解决什么？', aliases: ['监督微调', '人类反馈对齐'], difficulty: '高频',
    summary: 'SFT 学示范行为，RLHF 用偏好信号进一步优化输出选择。',
    answer: 'SFT 对高质量指令—回答做监督学习，让模型掌握任务格式和基本行为。经典 RLHF 再收集回答排序训练奖励模型，并用 PPO 在保持接近参考模型的约束下优化策略。SFT 是良好起点，RLHF 更关注难以写成标准答案的偏好。',
    intuition: '先看标准答案学会怎么答，再由评审对多个答案排序，学习更细的偏好。',
    keyPoints: ['SFT 使用 token 级标签', '奖励模型学习偏好', 'KL 约束防止策略漂移'],
    followUps: ['DPO 为什么不需要显式奖励模型？', 'RLHF 会出现哪些 reward hacking？'],
    sources: [paper('Training language models to follow instructions with human feedback', 'https://arxiv.org/abs/2203.02155')],
  },
  {
    id: 'cross-entropy', domainId: 'loss', title: '交叉熵和负对数似然是什么关系？', aliases: ['CE Loss', 'NLL'], difficulty: '基础',
    summary: 'one-hot 标签下，交叉熵就是正确类别的负对数概率。',
    answer: '交叉熵衡量真实分布与预测分布的差异。分类任务的真实标签通常是 one-hot，此时只有正确类别项保留，因此损失等于 -log p(y)。工程上 CrossEntropyLoss 通常直接接收未归一化 logits，并在内部组合 LogSoftmax 与 NLL。',
    intuition: '对正确答案信心越低，受到的惩罚越大；自信地答错会被重罚。', formula: 'H(p,q) = -Σᵢ pᵢ log qᵢ',
    keyPoints: ['输入通常是 logits', 'one-hot 时等价 NLL', '数值稳定实现使用 log-sum-exp'],
    followUps: ['为什么不要先手动 Softmax？', 'label smoothing 改变了什么？'],
    sources: [docs('PyTorch CrossEntropyLoss', 'https://docs.pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html')],
  },
  {
    id: 'kl-divergence', domainId: 'loss', title: 'KL 散度为什么不是距离？', aliases: ['KLD', '相对熵'], difficulty: '高频',
    summary: 'KL 非负但不对称，也不满足三角不等式。',
    answer: 'KL(P‖Q) 衡量用 Q 编码来自 P 的样本所增加的信息量。交换 P、Q 一般得到不同结果；当 Q 在 P 有概率质量的位置给出零概率时，前向 KL 甚至无穷大。蒸馏和策略优化中方向不同，会产生覆盖模式或追逐模式的不同倾向。',
    intuition: '拿一张错误地图解释真实道路，额外绕路成本取决于哪张图是真实标准。', formula: 'Dₖₗ(P‖Q)=ΣₓP(x)log(P(x)/Q(x))',
    keyPoints: ['非对称', '非负', '方向影响优化行为'],
    followUps: ['交叉熵与 KL 的关系？', 'JS 散度如何改进对称性？'],
    sources: [docs('PyTorch KLDivLoss', 'https://docs.pytorch.org/docs/stable/generated/torch.nn.KLDivLoss.html')],
  },
  {
    id: 'focal-loss', domainId: 'loss', title: 'Focal Loss 解决什么问题？', aliases: ['类别不均衡', '难样本'], difficulty: '进阶',
    summary: '降低大量易分类样本的权重，让训练聚焦困难样本。',
    answer: '在类别极不均衡的检测任务中，数量庞大的易负样本会主导普通交叉熵。Focal Loss 乘上 (1-pₜ)^γ：预测越正确，调制因子越小；困难或错分样本保留更大梯度。α 还可进一步平衡类别。',
    intuition: '简单题做对后少给分，把注意力留给反复做错的难题。', formula: 'FL(pₜ)=-αₜ(1-pₜ)^γlog(pₜ)',
    keyPoints: ['γ 控制聚焦强度', 'α 平衡类别', '适用于易样本占比极高场景'],
    followUps: ['它和 class weight 有何区别？', 'γ 过大会怎样？'],
    sources: [paper('Focal Loss for Dense Object Detection', 'https://arxiv.org/abs/1708.02002')],
  },
  {
    id: 'batchnorm-layernorm', domainId: 'deep-learning', title: 'BatchNorm 和 LayerNorm 如何选择？', aliases: ['BN', 'LN', '归一化'], difficulty: '高频',
    summary: 'BN 跨 batch 统计，LN 在单样本特征维归一化。',
    answer: 'BatchNorm 对同一通道跨 batch 统计均值方差，依赖批量大小且训练、推理行为不同，适合稳定大 batch 的视觉网络。LayerNorm 对每个样本的特征维归一化，不依赖其他样本，更适合变长序列和 Transformer。',
    intuition: 'BN 把同班同学横向比较，LN 则只看一个学生各科成绩的内部尺度。',
    keyPoints: ['统计维度不同', 'BN 有运行统计量', 'LN 对 batch size 不敏感'],
    followUps: ['Pre-LN 与 Post-LN 有何区别？', 'RMSNorm 去掉了什么？'],
    sources: [paper('Layer Normalization', 'https://arxiv.org/abs/1607.06450')],
  },
  {
    id: 'gradient-vanishing', domainId: 'deep-learning', title: '梯度消失与爆炸为什么发生？', aliases: ['vanishing gradient', 'exploding gradient'], difficulty: '基础',
    summary: '深层链式求导反复相乘，使梯度指数级缩小或放大。',
    answer: '反向传播要连乘多层 Jacobian。当其主导奇异值长期小于 1，梯度趋近零；大于 1 则可能爆炸。合适初始化、残差连接、归一化和非饱和激活能改善信号传播；梯度裁剪主要抑制爆炸，不能根治消失。',
    intuition: '消息每经过一人都打折或放大，传很多层后可能听不见，也可能震耳欲聋。',
    keyPoints: ['链式法则连乘', '残差提供短路径', '梯度裁剪只限制范数'],
    followUps: ['Xavier 与 Kaiming 初始化依据什么？', '残差连接如何改善梯度？'],
    sources: [paper('Deep Residual Learning for Image Recognition', 'https://arxiv.org/abs/1512.03385')],
  },
  {
    id: 'mdp', domainId: 'reinforcement-learning', title: 'MDP 的五个要素是什么？', aliases: ['马尔可夫决策过程', 'state action reward'], difficulty: '基础',
    summary: '状态、动作、转移、奖励与折扣共同定义序贯决策问题。',
    answer: 'MDP 通常写作 (S,A,P,R,γ)。马尔可夫性要求给定当前状态后，未来与更早历史条件独立。策略 π 决定状态下的动作分布，智能体最大化折扣累计回报。状态若不足以满足马尔可夫性，就更接近 POMDP。',
    intuition: '棋局当前盘面足够决定下一步，不必知道每颗棋子过去如何移动。', formula: 'Gₜ=Σₖ₌₀∞γᵏrₜ₊ₖ₊₁',
    keyPoints: ['马尔可夫性', '转移概率', '折扣累计回报'],
    followUps: ['为什么需要折扣因子？', 'POMDP 与 MDP 的区别？'],
    sources: [docs('Sutton & Barto: Reinforcement Learning', 'http://incompleteideas.net/book/the-book-2nd.html')],
  },
  {
    id: 'value-policy', domainId: 'reinforcement-learning', title: 'Value-based 与 Policy-based 有何区别？', aliases: ['价值函数', '策略梯度'], difficulty: '高频',
    summary: '前者先估计动作价值再选动作，后者直接参数化并优化策略。',
    answer: 'Value-based 方法如 DQN 学 Q(s,a)，通过 argmax 间接得到策略，适合离散动作。Policy-based 方法直接学习 π(a|s)，能自然处理连续或随机策略，但梯度方差较大。Actor-Critic 让 Actor 更新策略、Critic 估值降低方差。',
    intuition: '一种先给每个选项打分再选最高分，另一种直接学习该怎么选。',
    keyPoints: ['DQN 学 Q 函数', '策略梯度可处理连续动作', 'Actor-Critic 结合二者'],
    followUps: ['策略梯度为什么方差大？', 'Advantage 起什么作用？'],
    sources: [paper('Human-level control through deep reinforcement learning', 'https://www.nature.com/articles/nature14236')],
  },
  {
    id: 'ppo', domainId: 'reinforcement-learning', title: 'PPO 为什么要裁剪概率比？', aliases: ['Proximal Policy Optimization', 'clip objective'], difficulty: '进阶',
    summary: '限制单次策略更新幅度，避免利用旧数据时策略变化过猛。',
    answer: 'PPO 用新旧策略对同一动作的概率比乘 Advantage。直接最大化可能让概率比偏离 1 太远，导致策略崩坏。Clip 目标在比率超出 [1-ε,1+ε] 且继续变化会虚假提升目标时截断收益，形成易实现的保守更新。',
    intuition: '每轮可以调整方向，但限制步幅，防止一次迈太远摔倒。', formula: 'Lclip=E[min(rₜAₜ, clip(rₜ,1-ε,1+ε)Aₜ)]',
    keyPoints: ['重要性采样比率', '限制策略漂移', '仍需调学习率与多轮更新次数'],
    followUps: ['A 为负时 clip 如何工作？', 'PPO 与 TRPO 有何关系？'],
    sources: [paper('Proximal Policy Optimization Algorithms', 'https://arxiv.org/abs/1707.06347')],
  },
];

export const knowledgeCards: KnowledgeCard[] = [...baseKnowledgeCards, ...expandedKnowledgeCards, ...transformerKnowledgeCards];

export const knowledgeById = Object.fromEntries(knowledgeCards.map((card) => [card.id, card])) as Record<string, KnowledgeCard>;
export const domainById = Object.fromEntries(knowledgeDomains.map((domain) => [domain.id, domain])) as Record<string, KnowledgeDomain>;
