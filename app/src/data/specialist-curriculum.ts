import { buildNode, type NodeBlueprint } from '@/data/transformer/build-node';
import type { CourseSection, CourseUnit, KnowledgeCardInput, KnowledgeDomainId, KnowledgeSource, TargetRole } from '@/types/course';

type Topic = {
  id: string;
  title: string;
  domainId: KnowledgeDomainId;
  core: string;
  boundary: string;
  comparison: string;
  source: KnowledgeSource;
};

const paper = (title: string, url: string): KnowledgeSource => ({ title, url, kind: 'paper' });
const docs = (title: string, url: string): KnowledgeSource => ({ title, url, kind: 'docs' });

const algorithmTopics: Topic[] = [
  { id: 'alg-data-mixture', title: '预训练数据配比', domainId: 'llm', core: '数据配比决定模型把有限训练预算分给哪些语言、领域和质量层级，应通过小规模消融与下游评测迭代权重。', boundary: '高质量小领域数据不能无限上采样，否则会重复过拟合并损害通用能力。', comparison: '静态配比实现简单，动态配比可随训练阶段调整但归因更困难。', source: paper('DoReMi', 'https://arxiv.org/abs/2305.10429') },
  { id: 'alg-data-quality', title: '清洗、去重与质量过滤', domainId: 'llm', core: '数据管线要依次处理格式清洗、规则或模型质量过滤、精确与近似去重，并保留每一步的可追溯统计。', boundary: '过滤越严格不一定越好，误删稀有知识和少数语言会造成覆盖退化。', comparison: '精确哈希适合完全重复，MinHash 等近似方法用于发现改写或局部重叠。', source: paper('Deduplicating Training Data Makes Language Models Better', 'https://arxiv.org/abs/2107.06499') },
  { id: 'alg-tokenizer-tradeoff', title: '词表与多语言权衡', domainId: 'llm', core: 'Tokenizer 需要平衡词表大小、序列长度、跨语言公平性与数字代码切分，并用真实语料测量压缩率和未知字节回退。', boundary: '扩大词表会增加嵌入和输出层参数，也不能自动消除低资源语言的切分劣势。', comparison: 'BPE 依赖合并频次，Unigram 从候选子词中做概率化裁剪。', source: paper('SentencePiece', 'https://arxiv.org/abs/1808.06226') },
  { id: 'alg-causal-objective', title: '因果预训练与损失掩码', domainId: 'llm', core: '因果语言模型只预测下一个 token，padding、提示模板和不应学习的上下文必须通过 loss mask 排除。', boundary: 'Attention mask 控制可见性，loss mask 控制哪些位置计入目标，两者不能混为一谈。', comparison: '预训练通常学习全部有效 token，指令微调常只对 assistant 回答计算损失。', source: paper('Language Models are Few-Shot Learners', 'https://arxiv.org/abs/2005.14165') },
  { id: 'alg-scaling-eval', title: 'Scaling Law 与检查点评测', domainId: 'llm', core: 'Scaling Law 用参数量、数据量和算力预测平均损失趋势，检查点评测则验证能力、稳定性与数据污染。', boundary: '平均损失的幂律趋势不能替代具体能力、安全性和长尾任务评测。', comparison: '训练损失适合连续监控，下游基准更贴近能力但噪声和污染风险更高。', source: paper('Training Compute-Optimal Large Language Models', 'https://arxiv.org/abs/2203.15556') },

  { id: 'alg-sft-format', title: 'SFT 数据与对话模板', domainId: 'finetuning', core: 'SFT 样本要统一 system、user、assistant 边界及特殊 token，并保证训练模板与推理模板完全一致。', boundary: '模板错误会让模型学习错误角色边界，即使原始答案质量很高也无法补救。', comparison: '单轮样本便于控质，多轮样本能训练上下文承接但更易引入角色泄漏。', source: docs('Hugging Face Chat Templates', 'https://huggingface.co/docs/transformers/chat_templating') },
  { id: 'alg-base-chat', title: 'Base 与 Chat 模型选择', domainId: 'finetuning', core: 'Base 模型保留原始续写能力，Chat 模型已完成指令与偏好对齐；选择取决于数据规模、目标行为和可控性。', boundary: '少量领域数据从 Base 开始通常不足以补齐通用指令能力。', comparison: 'Base 可塑性强但训练成本高，Chat 起点好但可能继承既有对齐偏好。', source: paper('Training language models to follow instructions with human feedback', 'https://arxiv.org/abs/2203.02155') },
  { id: 'alg-lora-config', title: 'LoRA 与 QLoRA 配置', domainId: 'finetuning', core: 'LoRA 用低秩增量更新权重；rank 控制容量，alpha 控制缩放，target modules 决定改动位置，QLoRA 再量化冻结底座。', boundary: 'rank 增大并不保证效果提升，还会增加显存、通信和过拟合风险。', comparison: 'LoRA 保留高精度底座，QLoRA 用更低显存换取量化与反量化开销。', source: paper('QLoRA', 'https://arxiv.org/abs/2305.14314') },
  { id: 'alg-full-vs-peft', title: '全参微调与参数高效微调', domainId: 'finetuning', core: '全参微调容量最大但需要保存优化器状态和完整梯度；PEFT 只训练少量适配参数，更适合多任务与有限资源。', boundary: 'PEFT 节省可训练状态不等于推理一定更快，未合并适配器还可能增加调度复杂度。', comparison: '全参适合大数据深度迁移，PEFT 适合快速迭代和多租户适配。', source: paper('LoRA', 'https://arxiv.org/abs/2106.09685') },
  { id: 'alg-forgetting', title: '灾难性遗忘与回归评测', domainId: 'finetuning', core: '微调后既要测目标任务收益，也要用通用能力、拒答、安全和格式集合检查回归，并用数据混合或正则减轻遗忘。', boundary: '只看训练集或单一业务准确率无法证明模型整体变好。', comparison: '重放通用数据直接维持分布，参数约束则限制模型偏离但需要调权重。', source: paper('Overcoming catastrophic forgetting in neural networks', 'https://arxiv.org/abs/1612.00796') },

  { id: 'alg-reward-model', title: '偏好数据与奖励模型', domainId: 'reinforcement-learning', core: '奖励模型从同一提示下的回答排序学习相对偏好，数据需要控制位置偏差、长度偏差和标注一致性。', boundary: '奖励分数只在训练分布和标注规范内有意义，不能当作绝对真实效用。', comparison: '成对排序标注稳定直观，标量打分信息更细但标注尺度更难统一。', source: paper('Learning to summarize from human feedback', 'https://arxiv.org/abs/2009.01325') },
  { id: 'alg-ppo-rlhf', title: 'PPO-RLHF 四模型流程', domainId: 'reinforcement-learning', core: '经典 PPO-RLHF 包含策略、参考、奖励和价值模型；rollout 后估计优势，并在 KL 与裁剪约束下更新策略。', boundary: '四个模型不一定都以独立副本常驻，但逻辑职责不能省略。', comparison: 'PPO 显式在线采样并训练价值网络，DPO 直接优化离线偏好对。', source: paper('Training language models to follow instructions with human feedback', 'https://arxiv.org/abs/2203.02155') },
  { id: 'alg-dpo', title: 'DPO 目标与参考策略', domainId: 'reinforcement-learning', core: 'DPO 把奖励建模与策略优化化为偏好对上的分类目标，用参考策略约束新策略的相对概率变化。', boundary: 'DPO 仍依赖高质量偏好覆盖，离线数据之外的行为无法通过在线探索自动修正。', comparison: 'DPO 流程简单稳定，PPO 能利用在线反馈但系统和调参成本更高。', source: paper('Direct Preference Optimization', 'https://arxiv.org/abs/2305.18290') },
  { id: 'alg-grpo', title: 'GRPO 与可验证奖励', domainId: 'reinforcement-learning', core: 'GRPO 对同一问题采样一组回答，用组内相对奖励构造优势，从而避免单独训练与策略同规模的价值模型。', boundary: '组内归一化依赖有效的奖励差异，奖励稀疏或整组同分会削弱学习信号。', comparison: 'GRPO 用组统计作基线，PPO 通常依赖学习到的价值函数。', source: paper('DeepSeekMath', 'https://arxiv.org/abs/2402.03300') },
  { id: 'alg-reward-hacking', title: '奖励投机与 KL 控制', domainId: 'reinforcement-learning', core: '策略会利用奖励模型漏洞，因此要结合 KL 约束、规则校验、对抗样本和独立评测监控真实质量。', boundary: '提高 KL 惩罚只能限制漂移，不能修复奖励模型本身的错误偏好。', comparison: '过程奖励提供中间监督但标注复杂，结果奖励易验证却可能允许投机路径。', source: paper('Specification gaming examples in AI', 'https://arxiv.org/abs/2209.13085') },

  { id: 'alg-qwen-report', title: 'Qwen 架构与训练演进', domainId: 'llm', core: '阅读 Qwen 报告要从 tokenizer、架构、数据、训练阶段和评测五条线归纳，而不是只背参数规模。', boundary: '不同代际与尺寸可能采用不同配置，回答必须限定具体版本。', comparison: '技术报告解释设计与实验，模型卡补充具体权重、上下文和许可边界。', source: paper('Qwen Technical Report', 'https://arxiv.org/abs/2309.16609') },
  { id: 'alg-deepseek-v3', title: 'DeepSeek-V3 的 MLA 与 MoE', domainId: 'llm', core: 'DeepSeek-V3 用 MLA 压缩注意力键值表示，并用细粒度 MoE 在较低激活参数下扩大总容量，同时处理专家负载均衡。', boundary: '总参数量不等于每 token 计算量，激活参数也不等于实际吞吐。', comparison: '稠密模型每层激活全部参数，MoE 只路由到部分专家但引入通信与调度成本。', source: paper('DeepSeek-V3 Technical Report', 'https://arxiv.org/abs/2412.19437') },
  { id: 'alg-deepseek-r1', title: 'DeepSeek-R1 推理与蒸馏', domainId: 'reinforcement-learning', core: 'DeepSeek-R1 展示了可验证奖励强化推理、冷启动数据与后续对齐的组合，并将推理行为蒸馏到更小模型。', boundary: '蒸馏模型学习教师输出分布，不等同于复制教师完整训练过程或能力边界。', comparison: '直接 RL 强化可探索行为，蒸馏训练更稳定但受教师样本覆盖限制。', source: paper('DeepSeek-R1', 'https://arxiv.org/abs/2501.12948') },
  { id: 'alg-moe-routing', title: 'MoE 路由与负载均衡', domainId: 'llm', core: 'MoE 路由器为 token 选择少量专家，系统需同时处理容量、丢 token、专家并行通信和负载偏斜。', boundary: '路由均匀不等于专家学得有效，过强均衡损失可能损害专业化。', comparison: '辅助损失直接约束分配，辅助损失自由方法通过路由偏置调节负载。', source: paper('DeepSeek-V3 Technical Report', 'https://arxiv.org/abs/2412.19437') },
  { id: 'alg-long-context', title: '长上下文训练与 RoPE 扩展', domainId: 'transformer', core: '长上下文能力取决于位置扩展、长序列数据、注意力计算与检索式评测，不能只修改配置中的最大长度。', boundary: '通过短测例不代表长文全局理解，模型可能只在特定位置或局部检索上有效。', comparison: '位置插值改动小，分段或动态缩放可保留短程分辨率但参数更多。', source: paper('Extending Context Window of Large Language Models via Positional Interpolation', 'https://arxiv.org/abs/2306.15595') },

  { id: 'alg-parallelism', title: '四类并行策略', domainId: 'deep-learning', core: '数据并行复制模型切 batch，张量并行切算子，流水线并行切层，专家并行切 MoE 专家，实际系统常组合使用。', boundary: '并行度提高会增加通信、气泡或小矩阵开销，不会线性提升吞吐。', comparison: '张量并行通信频繁且适合节点内，流水线并行通信较粗但有气泡。', source: docs('Megatron Core Parallelisms', 'https://docs.nvidia.com/megatron-core/developer-guide/latest/api-guide/parallel_state.html') },
  { id: 'alg-zero-memory', title: 'ZeRO 与显存估算', domainId: 'deep-learning', core: 'ZeRO 按阶段分片优化器状态、梯度和参数；显存估算还要计入激活、临时 buffer、通信桶和碎片。', boundary: '只用参数量乘字节数会严重低估训练峰值显存。', comparison: 'ZeRO-2 分片优化器与梯度，ZeRO-3 继续分片参数但通信更复杂。', source: docs('DeepSpeed ZeRO', 'https://www.deepspeed.ai/tutorials/zero/') },
  { id: 'alg-mixed-precision', title: '混合精度与训练不稳定', domainId: 'deep-learning', core: '混合精度保留关键累加或主权重精度，同时用低精度提升吞吐；应监控溢出、下溢、梯度范数和 loss spike。', boundary: 'BF16 指数范围更大通常不需 loss scaling，但仍可能因模型或优化器数值问题发散。', comparison: 'FP16 精度更细但指数范围小，BF16 范围大但尾数更短。', source: docs('PyTorch AMP', 'https://docs.pytorch.org/docs/stable/amp.html') },
  { id: 'alg-quantization', title: 'PTQ、QAT、GPTQ 与 AWQ', domainId: 'deep-learning', core: '量化方案要区分训练后或感知训练、权重或激活位宽、校准数据及分组尺度，并以任务质量和硬件吞吐共同评估。', boundary: '模型文件变小不保证端到端更快，内核支持和反量化开销可能成为瓶颈。', comparison: 'GPTQ 以二阶近似逐层压缩，AWQ 保护显著权重并按激活统计缩放。', source: paper('AWQ', 'https://arxiv.org/abs/2306.00978') },
  { id: 'alg-bottleneck-diagnosis', title: '训练与推理瓶颈诊断', domainId: 'deep-learning', core: '诊断先分解数据加载、计算、通信、显存和调度时间，再用利用率、时间线和消融实验定位主瓶颈。', boundary: '单看 GPU 利用率不足以判断原因，等待通信、内存停顿和短 kernel 都可能呈现相似表象。', comparison: '训练关注前反向与通信重叠，推理需分别分析 prefill 吞吐和 decode 时延。', source: docs('PyTorch Profiler', 'https://docs.pytorch.org/tutorials/recipes/recipes/profiler_recipe.html') },
];

const applicationTopics: Topic[] = [
  { id: 'app-parsing-chunking', title: '文档解析、切块与元数据', domainId: 'llm', core: 'RAG 入库应先恢复标题、段落、表格和页码结构，再按语义与模型窗口切块，并保留来源、版本和权限元数据。', boundary: '固定字符切块实现简单，但会截断语义并破坏表格或标题层级。', comparison: '小块提高定位精度，大块保留上下文但增加噪声与 token 成本。', source: docs('LlamaIndex Node Parsers', 'https://docs.llamaindex.ai/en/stable/module_guides/loading/node_parsers/') },
  { id: 'app-embedding', title: 'Embedding 选择与相似度', domainId: 'llm', core: 'Embedding 选择要匹配语言、领域、查询文档长度和距离函数，并在自有标注集上测召回而非只看公开榜单。', boundary: '余弦相似度高只表示向量接近，不保证事实相关、时效正确或权限允许。', comparison: '余弦忽略向量模长，点积保留模长信息且常与模型训练目标绑定。', source: paper('Sentence-BERT', 'https://arxiv.org/abs/1908.10084') },
  { id: 'app-vector-index', title: '向量索引的召回与延迟', domainId: 'llm', core: '向量索引通过近似最近邻在召回率、内存、构建时间和查询延迟间取舍，参数必须用业务查询集调优。', boundary: '索引返回 top-k 近邻不代表这些结果足以回答问题。', comparison: 'HNSW 查询快且召回高但内存大，IVF 可控扫描范围但依赖聚类与探针数。', source: paper('Efficient and robust approximate nearest neighbor search using HNSW', 'https://arxiv.org/abs/1603.09320') },
  { id: 'app-reranking', title: 'Reranker 与候选阶段', domainId: 'llm', core: '两阶段检索先用廉价召回扩大候选，再用 cross-encoder 或专用 reranker 精排，最后控制送入模型的证据集合。', boundary: '扩大候选数会提高上限，也会增加重排延迟并引入更多相似噪声。', comparison: '双塔可离线编码适合召回，交叉编码联合阅读查询与文档更准但更慢。', source: paper('Passage Re-ranking with BERT', 'https://arxiv.org/abs/1901.04085') },
  { id: 'app-rag-pipeline', title: '端到端 RAG 链路', domainId: 'llm', core: '完整 RAG 包含摄取、索引、查询理解、召回、重排、上下文组装、生成、引用与评测，每段都需独立观测。', boundary: '回答错误不能直接归因于模型，可能是数据缺失、检索失败、上下文冲突或生成未遵循证据。', comparison: '离线链路决定知识质量，在线链路决定查询时的召回、时延和回答行为。', source: paper('Retrieval-Augmented Generation', 'https://arxiv.org/abs/2005.11401') },

  { id: 'app-hybrid-search', title: '稀疏与稠密混合检索', domainId: 'llm', core: '混合检索结合 BM25 的精确词项匹配与向量检索的语义泛化，常用分数归一化或 RRF 融合排序。', boundary: '直接相加不同检索器的原始分数通常没有意义，因为尺度和分布不同。', comparison: 'BM25 擅长编号与专有词，稠密检索擅长同义表达和语义改写。', source: paper('Precise Zero-Shot Dense Retrieval without Relevance Labels', 'https://arxiv.org/abs/2212.10496') },
  { id: 'app-query-routing', title: '查询改写、分解与路由', domainId: 'llm', core: '复杂查询可通过改写补全指代、分解多跳子问题，并按意图路由到不同索引或工具，但需保留原始约束。', boundary: '改写模型可能改变用户意图，因此要记录原查询并对关键实体做一致性检查。', comparison: '改写生成一个更可检索查询，分解则产生多个可独立求证的子问题。', source: paper('Query2doc', 'https://arxiv.org/abs/2303.07678') },
  { id: 'app-graph-rag', title: 'Graph RAG 与结构化检索', domainId: 'llm', core: 'Graph RAG 将实体、关系或社区摘要作为结构化检索单元，适合跨文档关系和全局主题问题。', boundary: '建图成本、实体消歧和更新一致性可能超过收益，简单事实检索未必需要图。', comparison: '向量检索按语义邻近找片段，图检索沿显式关系扩展证据。', source: paper('From Local to Global: A Graph RAG Approach', 'https://arxiv.org/abs/2404.16130') },
  { id: 'app-grounding', title: '引用、证据约束与拒答', domainId: 'llm', core: '可信回答应让结论可映射到具体证据片段，区分引用存在与引用支持，并在证据不足或冲突时拒答。', boundary: '附上链接不代表结论被支持，引用可能无关、过期或与表述相反。', comparison: '提示约束成本低但不可靠，句级归因与后验验证更稳健但增加延迟。', source: paper('ALCE', 'https://arxiv.org/abs/2305.14627') },
  { id: 'app-rag-evaluation', title: '检索与生成分层评测', domainId: 'llm', core: 'RAG 评测要分开测检索 recall、排序质量、答案正确性、忠实度、引用覆盖和端到端任务成功率。', boundary: '端到端分数下降时若没有分层指标，就无法判断应改索引还是生成策略。', comparison: '检索指标依赖相关文档标注，生成指标依赖参考答案或可靠评审。', source: paper('RAGAS', 'https://arxiv.org/abs/2309.15217') },

  { id: 'app-workflow-agent', title: 'Workflow 与 Agent 边界', domainId: 'llm', core: 'Workflow 由代码预先规定路径，Agent 让模型根据状态选择下一步；稳定流程优先工作流，不确定决策才引入代理。', boundary: '把每个步骤都交给模型会降低可预测性、可测试性并放大成本。', comparison: 'Workflow 可审计且易复现，Agent 灵活但必须设置权限、预算和停止条件。', source: docs('Building Effective Agents', 'https://www.anthropic.com/research/building-effective-agents') },
  { id: 'app-tool-schema', title: 'Function Calling 与工具 Schema', domainId: 'llm', core: '工具描述要明确用途、参数类型、必填项和约束；运行时必须验证模型参数、执行权限并把结构化结果返回模型。', boundary: '模型生成的工具参数是不可信输入，不能绕过服务端验证和鉴权。', comparison: '结构化调用便于校验与路由，自由文本协议灵活但解析和安全边界更弱。', source: docs('JSON Schema', 'https://json-schema.org/specification') },
  { id: 'app-memory', title: '短期、长期与外部记忆', domainId: 'llm', core: '短期记忆维护当前任务状态，长期记忆保存可复用事实或偏好，外部存储负责持久化；写入和召回都要有策略。', boundary: '把全部历史塞进上下文既昂贵又会引入过期信息和提示注入。', comparison: '摘要压缩上下文但可能丢细节，检索记忆按需读取但依赖召回质量。', source: paper('Generative Agents', 'https://arxiv.org/abs/2304.03442') },
  { id: 'app-agent-control', title: '规划、反思、重试与停止', domainId: 'llm', core: 'Agent 控制环需要显式状态、最大步数、超时、幂等重试、错误分类和成功判定，反思只在能提供新信息时触发。', boundary: '无上限自我反思会重复消耗 token，并不保证从错误中恢复。', comparison: '固定计划可控但适应性弱，边执行边规划能利用观测但更易漂移。', source: paper('ReAct', 'https://arxiv.org/abs/2210.03629') },
  { id: 'app-mcp-multiagent', title: 'MCP 与多 Agent 边界', domainId: 'llm', core: 'MCP 标准化客户端与工具、资源、提示服务之间的能力发现和调用；多 Agent 则划分决策职责，两者解决的问题不同。', boundary: '协议互通不等于工具可信，客户端仍需用户授权、能力隔离和结果校验。', comparison: 'MCP 连接能力提供方，多 Agent 协调多个决策主体。', source: docs('Model Context Protocol Specification', 'https://modelcontextprotocol.io/specification/latest') },

  { id: 'app-golden-set', title: '黄金数据集与任务指标', domainId: 'llm', core: '评测集应覆盖真实任务、失败边界和关键用户分层，保留版本与标注规范，并将质量、延迟和成本共同作为验收指标。', boundary: '随机抽取少量正常样本会掩盖长尾、高风险和对抗场景。', comparison: '静态黄金集便于回归，线上反馈贴近分布但选择偏差更大。', source: docs('MLCommons AI Safety Benchmark', 'https://mlcommons.org/benchmarks/ai-safety/') },
  { id: 'app-llm-judge', title: 'LLM Judge 偏差与校准', domainId: 'llm', core: 'LLM Judge 可规模化评估开放回答，但要控制位置、长度、自偏好和提示敏感性，并用人工标注集校准一致性。', boundary: '评审模型给出高分不等于事实正确，尤其不能替代高风险领域专家审核。', comparison: '成对比较通常比绝对打分稳定，绝对分数便于阈值管理但尺度漂移更明显。', source: paper('Judging LLM-as-a-Judge', 'https://arxiv.org/abs/2306.05685') },
  { id: 'app-hallucination-guardrail', title: '幻觉检测与 Guardrail', domainId: 'llm', core: '防幻觉应组合检索证据、输出约束、事实验证和不确定性处理，并按错误类型设计不同拦截策略。', boundary: '单一敏感词或“请勿幻觉”提示无法识别事实性错误。', comparison: '生成前约束减少风险输入，生成后验证能检查实际输出但增加延迟。', source: paper('SelfCheckGPT', 'https://arxiv.org/abs/2303.08896') },
  { id: 'app-prompt-security', title: '提示注入、泄漏与工具安全', domainId: 'llm', core: '系统必须把外部内容视为不可信数据，隔离指令与数据，最小化工具权限，并对敏感读取和写操作做独立授权。', boundary: '仅靠系统提示无法形成安全边界，模型可能被间接注入诱导。', comparison: '输入过滤可拦截已知模式，权限隔离即使检测失败也能限制损害。', source: docs('OWASP Top 10 for LLM Applications', 'https://genai.owasp.org/llm-top-10/') },
  { id: 'app-observability', title: 'Tracing、反馈与漂移监控', domainId: 'llm', core: '每次请求应串联模型、检索和工具 span，记录版本、延迟、token、错误与质量信号，并对数据与行为漂移告警。', boundary: '日志不能原样保存敏感提示、文档或工具凭据，需脱敏和最短留存。', comparison: 'Tracing 解释单次链路，聚合指标发现系统性趋势。', source: docs('OpenTelemetry Traces', 'https://opentelemetry.io/docs/concepts/signals/traces/') },

  { id: 'app-api-resilience', title: '模型 API、流式、缓存与降级', domainId: 'llm', core: '模型网关应处理流式中断、超时、重试、幂等、缓存键和供应商降级，并区分可重试与永久错误。', boundary: '对非幂等工具调用盲目重试可能造成重复写入或扣费。', comparison: '语义缓存命中范围广但可能返回过期答案，精确缓存风险低但命中率有限。', source: docs('HTTP Semantics', 'https://www.rfc-editor.org/rfc/rfc9110') },
  { id: 'app-concurrency', title: '并发、连续批处理与背压', domainId: 'llm', core: '在线推理通过连续批处理提高 GPU 利用率，入口还需限流、队列上限、超时和背压避免流量把系统拖垮。', boundary: '吞吐最大化可能显著恶化首 token 和尾延迟，不能只优化 tokens/s。', comparison: '静态批处理等待整批完成，连续批处理可在序列结束时动态补入请求。', source: paper('Orca', 'https://www.usenix.org/conference/osdi22/presentation/yu') },
  { id: 'app-cost-routing', title: 'Token 成本、时延预算与路由', domainId: 'llm', core: '应把解析、检索、重排、首 token、生成和工具时间拆进预算，并按任务难度、风险和上下文路由模型。', boundary: '一律使用小模型会降低复杂任务成功率，一律使用大模型则无法控制成本和容量。', comparison: '规则路由稳定易审计，学习型路由适应性强但需要标签与回退。', source: paper('FrugalGPT', 'https://arxiv.org/abs/2305.05176') },
  { id: 'app-incident', title: '线上故障诊断与降级', domainId: 'llm', core: '故障处理先按依赖和阶段定位，再通过关闭非关键工具、缩短上下文、切备用模型或返回可解释静态结果降级。', boundary: '降级必须保留正确性和权限边界，不能为了可用性返回未经验证的内容。', comparison: '熔断快速隔离持续失败依赖，限流保护容量，两者触发信号不同。', source: docs('Site Reliability Engineering', 'https://sre.google/sre-book/handling-overload/') },
  { id: 'app-project-review', title: '项目复盘的证据链', domainId: 'llm', core: '项目表达按问题、基线、方案、实验、取舍、结果和教训组织，并用可复现指标证明自己负责的改动。', boundary: '只介绍框架和最终数字无法说明问题定义、个人贡献或结果是否来自该改动。', comparison: '功能清单描述做了什么，证据链解释为何做、如何验证以及代价。', source: docs('Google Engineering Practices: Review', 'https://google.github.io/eng-practices/review/') },
];

const sectionNames: Record<TargetRole, string[]> = {
  llm_algorithm: ['预训练数据与目标', '监督微调与 PEFT', '偏好对齐与推理 RL', '现代模型技术报告', '训练系统与推理工程'],
  llm_application: ['RAG 基础', '高级检索与忠实度', 'Workflow、Agent 与工具', '评测、安全与可观测性', '部署与项目诊断'],
};

const rolePrefix: Record<TargetRole, string> = { llm_algorithm: '算法', llm_application: '应用' };

function toBlueprint(topic: Topic, role: TargetRole): NodeBlueprint {
  const fact3 = role === 'llm_algorithm' ? '回答时要同时说明算法机制、训练代价和评测证据。' : '回答时要同时说明离线链路、在线边界和可观测证据。';
  return {
    id: topic.id,
    title: topic.title,
    shortTitle: topic.title,
    subtitle: `${rolePrefix[role]}岗高频追问`,
    icon: role === 'llm_algorithm' ? 'network' : 'branch',
    knowledgeIds: [`kb-${topic.id}`],
    core: topic.core,
    facts: [topic.core, topic.boundary, fact3],
    traps: [
      `${topic.title}只要采用最复杂的方案就一定最好。`,
      `${topic.title}只需要关注离线平均分，不必验证真实边界。`,
      `${topic.title}出现问题时直接增加模型规模即可解决。`,
    ],
    sequence: ['明确业务目标与约束', '建立可复现基线', '只改变一个关键变量做实验', '按质量、成本与失败样本复盘'],
    interview: [topic.core, topic.comparison, topic.boundary],
    scenario: `项目中的${topic.title}指标突然变差，第一步最合理的处理是什么？`,
    scenarioAnswer: '先固定输入、版本和指标口径，分阶段复现并定位变化点，再选择改动。',
    boundary: topic.boundary,
    comparison: topic.comparison,
    specialist: true,
  };
}

function buildUnit(role: TargetRole, topics: Topic[]): CourseUnit {
  const palette = role === 'llm_algorithm'
    ? { color: '#6C52E5', darkColor: '#5138BD', softColor: '#EEE9FF' }
    : { color: '#25B995', darkColor: '#16856B', softColor: '#E7FAF4' };
  const sections: CourseSection[] = sectionNames[role].map((title, index) => ({
    id: `${role === 'llm_algorithm' ? 'alg' : 'app'}-section-${index + 1}`,
    title: `Section ${index + 1} · ${title}`,
    shortTitle: title,
    description: '5 个节点 · 每节点 12 道面试练习',
    ...palette,
    nodes: topics.slice(index * 5, index * 5 + 5).map((topic) => buildNode(toBlueprint(topic, role))),
  }));
  return {
    id: role,
    title: role === 'llm_algorithm' ? 'Unit 2 · 大模型算法工程师' : 'Unit 2 · 大模型应用工程师',
    subtitle: role === 'llm_algorithm' ? '训练、对齐、架构与系统' : 'RAG、Agent、评测与生产',
    description: '5 个 Section · 25 个节点 · 每节点 12 题',
    sections,
  };
}

function toKnowledge(topic: Topic, role: TargetRole): KnowledgeCardInput {
  return {
    id: `kb-${topic.id}`,
    domainId: topic.domainId,
    title: topic.title,
    interviewQuestion: `请解释${topic.title}，并说明工程取舍。`,
    aliases: [],
    difficulty: '高频',
    summary: topic.core,
    answer: `${topic.core} ${topic.comparison} 实际项目中应先定义目标和基线，再用分阶段指标定位收益与回归。`,
    intuition: `把${topic.title}看作一项受质量、成本和风险共同约束的系统决策，而不是孤立技巧。`,
    keyPoints: [topic.core, topic.comparison, topic.boundary],
    followUps: [`你会如何为${topic.title}建立基线？`, '线上指标变差时如何定位？', `什么时候不应该使用${topic.title}相关方案？`],
    misconceptions: [`只追求单一平均指标就足够。`, topic.boundary],
    sources: [topic.source],
    roles: [role],
  };
}

export const algorithmUnit = buildUnit('llm_algorithm', algorithmTopics);
export const applicationUnit = buildUnit('llm_application', applicationTopics);
export const algorithmNodes = algorithmUnit.sections.flatMap((section) => section.nodes);
export const applicationNodes = applicationUnit.sections.flatMap((section) => section.nodes);
export const specialistNodes = [...algorithmNodes, ...applicationNodes];
export const specialistKnowledgeCards = [
  ...algorithmTopics.map((topic) => toKnowledge(topic, 'llm_algorithm')),
  ...applicationTopics.map((topic) => toKnowledge(topic, 'llm_application')),
];
export const algorithmKnowledgeCards = algorithmTopics.map((topic) => toKnowledge(topic, 'llm_algorithm'));

export type InterviewEvidence = {
  nodeId: string;
  role: TargetRole;
  retrievedAt: string;
  topicTags: string[];
  sources: { url: string; stage: string }[];
};

const algorithmEvidence = [
  'https://github.com/km1994/LLMs_interview_notes',
  'https://github.com/wdndev/llm_interview_note',
  'https://github.com/MisterBooo/llm-interview-questions',
];
const applicationEvidence = [
  'https://www.nowcoder.com/discuss/882634966025175040',
  'https://www.nowcoder.com/discuss/880841659733311488',
  'https://www.nowcoder.com/discuss/878600528970735616',
];

export const interviewEvidence: InterviewEvidence[] = [
  ...algorithmTopics.map((topic) => ({ nodeId: topic.id, role: 'llm_algorithm' as const, retrievedAt: '2026-08-15', topicTags: [topic.title], sources: algorithmEvidence.map((url) => ({ url, stage: 'topic-index' })) })),
  ...applicationTopics.map((topic) => ({ nodeId: topic.id, role: 'llm_application' as const, retrievedAt: '2026-08-15', topicTags: [topic.title], sources: applicationEvidence.map((url) => ({ url, stage: 'technical-interview' })) })),
];
