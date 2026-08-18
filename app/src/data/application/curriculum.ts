import { buildNode } from '@/data/transformer/build-node';
import { applicationUnit as legacyApplicationUnit } from '@/data/specialist-curriculum';
import type { CourseSection, CourseUnit, Exercise, KnowledgeCardInput, KnowledgeSource, LearningNode } from '@/types/course';

type TopicSpec = { id: string; title: string; core: string; source: KnowledgeSource };
const docs = (title: string, url: string): KnowledgeSource => ({ title, url, kind: 'docs' });
const paper = (title: string, url: string): KnowledgeSource => ({ title, url, kind: 'paper' });

const sectionSources = {
  model: docs('OpenAI-compatible API concepts', 'https://platform.openai.com/docs/api-reference'),
  rag: paper('Retrieval-Augmented Generation', 'https://arxiv.org/abs/2005.11401'),
  search: docs('Elasticsearch Reference', 'https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html'),
  eval: paper('RAGAS', 'https://arxiv.org/abs/2309.15217'),
  tools: docs('Model Context Protocol Specification', 'https://modelcontextprotocol.io/specification/latest'),
  agents: paper('ReAct', 'https://arxiv.org/abs/2210.03629'),
  safety: docs('OWASP Top 10 for LLM Applications', 'https://genai.owasp.org/llm-top-10/'),
  prod: docs('vLLM Documentation', 'https://docs.vllm.ai/en/latest/'),
};

const sections: { title: string; description: string; topics: TopicSpec[] }[] = [
  { title: '模型与上下文工程', description: '从模型选择到稳定的多轮 API', topics: [
    { id: 'app-model-selection', title: '模型能力与供应商选择', core: '模型选择需要同时验证任务质量、上下文、结构化输出、时延、价格、合规和供应稳定性。', source: sectionSources.model },
    { id: 'app-prompt-hierarchy', title: 'Prompt 指令层级与边界', core: '系统、开发者、用户和外部数据具有不同信任级别，冲突时必须遵循明确的指令优先级。', source: sectionSources.model },
    { id: 'app-structured-output', title: '结构化输出与 Schema 校验', core: '结构化输出仍是不可信输入，服务端要做 JSON Schema 校验、业务约束检查和失败修复。', source: docs('JSON Schema', 'https://json-schema.org/specification') },
    { id: 'app-context-budget', title: '上下文窗口与 Token 预算', core: '上下文预算应分配给指令、历史、检索证据和输出，并在截断前保留关键约束。', source: sectionSources.model },
    { id: 'app-conversation-state', title: '多轮状态与上下文压缩', core: '会话状态应区分事实、任务状态和原始对话，摘要必须可更新并避免把错误永久写入。', source: sectionSources.model },
    { id: 'app-streaming', title: '流式响应与中断处理', core: 'SSE 流式链路要处理首字延迟、客户端取消、半包、重连以及未完成结果的状态。', source: docs('Server-Sent Events', 'https://html.spec.whatwg.org/multipage/server-sent-events.html') },
    { id: 'app-api-resilience', title: '模型 API 错误、超时与重试', core: '模型网关要区分限流、超时、无效请求与供应商故障，并只对安全的请求采用有抖动退避。', source: docs('HTTP Semantics', 'https://www.rfc-editor.org/rfc/rfc9110') },
    { id: 'app-capability-boundary', title: '能力边界、拒答与回退', core: '系统应识别证据不足、模型不适配和高风险请求，并提供可解释拒答或受控回退。', source: sectionSources.model },
  ]},
  { title: 'RAG 数据工程', description: '让文档真正可检索、可更新、可授权', topics: [
    { id: 'app-document-parsing', title: 'PDF、HTML 与 Office 解析', core: '解析必须保留标题、段落、列表和页码等结构，而不是只获得无序纯文本。', source: sectionSources.rag },
    { id: 'app-ocr-quality', title: 'OCR 与扫描文档质量', core: 'OCR 需要记录页级置信度并对低置信文本降权或人工复核，避免错误文字污染索引。', source: docs('PaddleOCR', 'https://www.paddleocr.ai/latest/en/index.html') },
    { id: 'app-layout-tables', title: '表格、图片与版面提取', core: '表格应保留行列语义和标题关联，图片需要说明文字或多模态解析才能进入检索。', source: paper('LayoutLMv3', 'https://arxiv.org/abs/2204.08387') },
    { id: 'app-parsing-chunking', title: '语义切块与重叠', core: '切块要围绕语义边界、模型窗口和检索粒度设计，并用命中与答案指标验证。', source: sectionSources.rag },
    { id: 'app-parent-child', title: '父子块与层级检索', core: '小子块用于精确召回，父块用于补全上下文，但扩展时要控制重复和噪声。', source: sectionSources.rag },
    { id: 'app-metadata', title: '元数据设计与过滤', core: '来源、时间、类型、版本和业务标签应成为可过滤字段，并与正文索引同步更新。', source: sectionSources.rag },
    { id: 'app-permission-filter', title: '文档权限与租户隔离', core: '权限过滤必须在检索阶段强制执行，不能依赖模型在看到越权文本后自行忽略。', source: sectionSources.safety },
    { id: 'app-index-update', title: '增量索引、更新与删除', core: '增量索引要用稳定文档版本处理幂等写入、旧块删除和缓存失效。', source: sectionSources.rag },
  ]},
  { title: '召回与排序', description: '在效果、延迟与成本之间建立检索链路', topics: [
    { id: 'app-embedding', title: 'Embedding 模型选择', core: 'Embedding 必须用目标语言、领域和查询长度的自有集合评测，不能只看公开榜单。', source: paper('Sentence-BERT', 'https://arxiv.org/abs/1908.10084') },
    { id: 'app-vector-similarity', title: '余弦、点积与归一化', core: '距离函数必须匹配模型训练方式和向量归一化状态，否则阈值与排序不可解释。', source: sectionSources.search },
    { id: 'app-bm25', title: 'BM25 与关键词检索', core: 'BM25 利用词频、逆文档频率和长度归一化，擅长编号、实体和精确术语。', source: paper('The Probabilistic Relevance Framework: BM25 and Beyond', 'https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf') },
    { id: 'app-hybrid-search', title: '稀疏与稠密混合检索', core: '混合检索应分别获得候选并通过归一化或 RRF 融合，不能直接相加不可比原始分数。', source: sectionSources.search },
    { id: 'app-vector-index', title: 'HNSW、IVF 与向量索引', core: '近似索引需要联合调节召回、内存、构建时间和 P95 查询延迟。', source: paper('HNSW', 'https://arxiv.org/abs/1603.09320') },
    { id: 'app-query-routing', title: '查询改写、分解与路由', core: '改写和分解必须保留实体与约束，并用原查询检查意图漂移。', source: paper('Query2doc', 'https://arxiv.org/abs/2303.07678') },
    { id: 'app-graph-rag', title: '多路召回、Graph RAG 与融合', core: '多路召回可用 RRF 融合不同排名；Graph RAG 则沿实体关系扩展证据，适合跨文档关联问题。', source: sectionSources.search },
    { id: 'app-reranking', title: 'Cross-Encoder 重排与候选预算', core: 'Reranker 联合编码查询与候选提高相关性，但候选规模会直接影响延迟和成本。', source: paper('Passage Re-ranking with BERT', 'https://arxiv.org/abs/1901.04085') },
  ]},
  { title: '生成与评测', description: '把端到端结果拆成可验证指标', topics: [
    { id: 'app-rag-pipeline', title: 'RAG 链路与上下文组装', core: '端到端链路要分别观测解析、召回、重排、上下文和生成；组装阶段还要去重并处理版本冲突。', source: sectionSources.rag },
    { id: 'app-grounding', title: '引用与证据归因', core: '引用质量需要验证每项结论是否由对应片段支持，而不是只检查是否存在链接。', source: paper('ALCE', 'https://arxiv.org/abs/2305.14627') },
    { id: 'app-insufficient-evidence', title: '证据不足与拒答', core: '拒答阈值应依据召回置信度、证据覆盖和风险等级联合决定。', source: sectionSources.rag },
    { id: 'app-retrieval-metrics', title: '检索指标与相关性标注', core: 'Recall@k、MRR 和 NDCG 衡量不同检索目标，前提是相关性标注可复核。', source: sectionSources.eval },
    { id: 'app-rag-evaluation', title: '答案正确性与忠实度', core: '正确性关注是否回答问题，忠实度关注回答是否受给定证据支持，两者必须分开测量。', source: sectionSources.eval },
    { id: 'app-golden-set', title: '黄金数据集设计与版本', core: '黄金集要覆盖主流程、长尾、拒答和对抗样本，并随知识与产品版本管理。', source: sectionSources.eval },
    { id: 'app-llm-judge', title: 'LLM Judge 偏差与校准', core: '模型评审存在位置、长度和自偏好，需要用人工子集校准并固定评审版本。', source: paper('Judging LLM-as-a-Judge', 'https://arxiv.org/abs/2306.05685') },
    { id: 'app-ablation', title: '消融实验与错误归因', core: '一次只改变关键变量，并按解析、召回、排序、上下文和生成阶段归因端到端变化。', source: sectionSources.eval },
  ]},
  { title: 'Workflow 与工具调用', description: '让模型调用外部能力但不越过边界', topics: [
    { id: 'app-workflow-agent', title: 'Workflow 与 Agent 边界', core: '确定流程优先使用可测试的 Workflow，只有不确定决策才交给 Agent。', source: docs('Building Effective Agents', 'https://www.anthropic.com/research/building-effective-agents') },
    { id: 'app-function-lifecycle', title: 'Function Calling 生命周期', core: '完整调用包含能力描述、模型选择、参数校验、执行、结果封装和下一轮决策。', source: sectionSources.tools },
    { id: 'app-tool-schema', title: '工具 Schema 与参数校验', core: '工具参数来自模型，必须按类型、范围、枚举和业务权限在服务端重新校验。', source: docs('JSON Schema', 'https://json-schema.org/specification') },
    { id: 'app-state-checkpoint', title: '状态机与 Checkpoint', core: '显式状态和 Checkpoint 让长流程可恢复、可审计，并避免重放已完成副作用。', source: docs('LangGraph Persistence', 'https://docs.langchain.com/oss/python/langgraph/persistence') },
    { id: 'app-parallel-tools', title: '并行与依赖工具执行', core: '无依赖只读工具可并行，有依赖或写操作必须按数据依赖和副作用顺序调度。', source: sectionSources.tools },
    { id: 'app-idempotency', title: '幂等、重试与补偿', core: '写操作用幂等键防止重复执行，不可逆失败需要补偿或人工处理而非盲目重试。', source: docs('HTTP Semantics', 'https://www.rfc-editor.org/rfc/rfc9110') },
    { id: 'app-human-confirmation', title: '人工确认与敏感操作', core: '付款、删除和外发数据等高影响操作必须在执行前展示参数并获得明确确认。', source: sectionSources.safety },
    { id: 'app-mcp-multiagent', title: 'MCP 架构与信任边界', core: 'MCP 统一能力发现和调用协议，但授权、信任与结果验证仍由宿主应用负责。', source: sectionSources.tools },
  ]},
  { title: 'Agent 与记忆', description: '控制决策循环、上下文和复杂协作', topics: [
    { id: 'app-planning', title: '规划策略与动态更新', core: '计划应拆成可验证步骤，并在工具观测改变前提时更新而不是机械执行。', source: sectionSources.agents },
    { id: 'app-reflection', title: '反思与有效重试条件', core: '反思只有在获得新证据或明确错误信号时才有价值，否则会形成高成本循环。', source: sectionSources.agents },
    { id: 'app-agent-control', title: '停止条件、预算与防循环', core: 'Agent 必须有最大步数、时间、费用和工具调用预算，并定义成功与失败终态。', source: sectionSources.agents },
    { id: 'app-short-memory', title: '短期工作记忆', core: '短期记忆保存当前任务必要状态，不能把全部对话无差别复制到每轮上下文。', source: sectionSources.agents },
    { id: 'app-memory', title: '长期与外部记忆', core: '长期记忆要定义写入、召回、更新和遗忘策略，避免过期或错误信息反复影响决策。', source: paper('Generative Agents', 'https://arxiv.org/abs/2304.03442') },
    { id: 'app-memory-compression', title: '上下文压缩与信息损失', core: '摘要和选择性保留能降低 token 成本，但必须验证关键约束和未完成任务没有丢失。', source: sectionSources.agents },
    { id: 'app-multi-agent', title: '多 Agent 协作与职责', core: '多 Agent 只有在职责、状态和验收边界清晰时才有收益，否则只会增加通信与错误传播。', source: sectionSources.agents },
    { id: 'app-agent-recovery', title: '局部失败与恢复', core: '恢复机制要记录已完成步骤、副作用和可重试边界，从最近安全 Checkpoint 继续。', source: sectionSources.agents },
  ]},
  { title: '安全与可观测性', description: '让错误、攻击和漂移能够被发现与限制', topics: [
    { id: 'app-prompt-security', title: '直接 Prompt Injection', core: '用户输入不能覆盖系统安全规则，敏感能力需要代码层权限控制而非提示承诺。', source: sectionSources.safety },
    { id: 'app-indirect-injection', title: '检索内容中的间接注入', core: '网页和文档属于不可信数据，检索到的指令不得获得系统或工具控制权。', source: sectionSources.safety },
    { id: 'app-data-leakage', title: '数据泄漏与敏感信息', core: '输入、检索、缓存、日志和模型供应商都是泄漏面，需要分类、脱敏和最短留存。', source: sectionSources.safety },
    { id: 'app-tool-permission', title: '工具最小权限', core: '每个工具只获得完成当前动作所需的最小数据域和操作权限。', source: sectionSources.safety },
    { id: 'app-hallucination-guardrail', title: '输出校验与 Guardrail', core: '输出安全要结合结构校验、事实验证、策略检查和受控拒答，不能只靠关键词。', source: sectionSources.safety },
    { id: 'app-observability', title: '检索、模型与工具 Trace', core: '统一 trace 应串联检索、模型与工具 span，同时对正文、密钥和个人信息脱敏。', source: docs('OpenTelemetry Traces', 'https://opentelemetry.io/docs/concepts/signals/traces/') },
    { id: 'app-feedback-drift', title: '反馈闭环与行为漂移', core: '反馈需关联版本和失败类型，漂移监控要区分输入分布变化与系统回归。', source: sectionSources.safety },
    { id: 'app-red-team', title: '红队与对抗评测', core: '红队集合覆盖越权、注入、隐私和资源滥用，并在每次关键变更后回归。', source: sectionSources.safety },
  ]},
  { title: '生产工程', description: '围绕 Redis、vLLM 与线上可靠性落地', topics: [
    { id: 'app-cache-redis', title: 'Redis 精确缓存与语义缓存', core: '缓存键必须包含模型、提示和知识版本，语义缓存还要控制相似阈值、权限和过期。', source: docs('Redis Documentation', 'https://redis.io/docs/latest/') },
    { id: 'app-concurrency', title: '并发、队列与背压', core: '入口限流、有限队列和超时共同保护容量，过载时应尽早拒绝而不是无限排队。', source: docs('Site Reliability Engineering', 'https://sre.google/sre-book/handling-overload/') },
    { id: 'app-vllm-batching', title: 'vLLM 连续批处理与时延', core: '连续批处理动态加入和移除序列以提高吞吐，但批大小与长请求会影响首字和尾延迟。', source: sectionSources.prod },
    { id: 'app-cost-routing', title: '模型路由与回退', core: '路由根据难度、风险、时延和成本选择模型，并为供应商故障设置可验证回退。', source: paper('FrugalGPT', 'https://arxiv.org/abs/2305.05176') },
    { id: 'app-token-budget', title: 'Token 成本与时延预算', core: '预算要拆到检索、重排、输入、输出和工具环节，并同时监控平均值与尾部。', source: sectionSources.prod },
    { id: 'app-capacity', title: '容量规划与自动扩缩容', core: '容量规划结合请求到达率、序列长度、显存、吞吐和冷启动，而不是只看并发数。', source: sectionSources.prod },
    { id: 'app-incident', title: '熔断与优雅降级', core: '持续失败依赖应被熔断，降级要保留正确性、权限和可解释状态。', source: docs('Site Reliability Engineering', 'https://sre.google/sre-book/handling-overload/') },
    { id: 'app-project-review', title: '技术复盘与事故分析', core: '复盘用时间线、影响、证据、根因和行动项说明系统问题，避免只归咎个人。', source: docs('Google SRE Postmortem Culture', 'https://sre.google/sre-book/postmortem-culture/') },
  ]},
];

const legacyById = new Map(legacyApplicationUnit.sections.flatMap((section) => section.nodes).map((node) => [node.id, node]));
const categories = ['concept', 'concept', 'concept', 'concept', 'concept', 'concept', 'mechanism', 'mechanism', 'mechanism', 'mechanism', 'selection', 'selection', 'selection', 'selection', 'troubleshooting', 'troubleshooting', 'troubleshooting', 'troubleshooting', 'metrics', 'metrics', 'metrics', 'oral', 'oral', 'oral'] as const;

function baseNode(topic: TopicSpec): LearningNode {
  const legacy = legacyById.get(topic.id);
  if (legacy) return { ...legacy, title: topic.title, shortTitle: topic.title, subtitle: '应用岗高频追问', knowledgeIds: [`kb-${topic.id}`] };
  return buildNode({
    id: topic.id, title: topic.title, shortTitle: topic.title, subtitle: '应用岗高频追问', icon: 'branch', knowledgeIds: [`kb-${topic.id}`],
    core: topic.core,
    facts: [topic.core, `该主题必须用可复现指标验证。`, `工程实现要同时考虑质量、延迟、成本和安全。`],
    traps: [`${topic.title}只要接入框架默认配置即可。`, `${topic.title}只看平均指标就足够。`, `${topic.title}发生异常时只需扩大模型。`],
    sequence: ['固定输入与版本', '建立分阶段基线', '改变单一变量', '复盘质量、成本与失败样本'],
    interview: [topic.core, '说明关键指标与观测信号。', '主动补充失败边界与回退方案。'],
    scenario: `${topic.title}上线后质量下降且 P95 延迟上升，首先应该怎样定位？`,
    scenarioAnswer: '固定请求和版本，按输入、处理、模型与依赖分段复现，再用 trace 和消融定位变化点。',
    boundary: `${topic.title}不能脱离业务约束和验证数据单独判断优劣。`,
    comparison: `比较${topic.title}的保守方案与高复杂度方案在效果、时延和维护成本上的取舍。`,
    specialist: true,
  });
}

function expandNode(topic: TopicSpec): LearningNode {
  const first = baseNode(topic).exercises;
  const second = first.map((exercise, index): Exercise => ({
    ...exercise,
    id: `${topic.id}-${String(index + 13).padStart(2, '0')}`,
    eyebrow: index < 4 ? '进阶 · 原理' : index < 8 ? '工程 · 排障' : '追问 · 取舍',
    prompt: index < 4
      ? `进一步判断：${exercise.prompt} 回答必须结合“${topic.core}”这一机制。`
      : index < 8
        ? `线上证据发生变化时，${exercise.prompt}`
        : `面试官继续追问边界与指标：${exercise.prompt}`,
    explanation: `${exercise.explanation} 本题还需要把结论落到${topic.title}的指标、失败条件与回退策略。`,
  }));
  return { ...baseNode(topic), exercises: [...first, ...second].map((exercise, index) => ({ ...exercise, practiceKind: categories[index] })) };
}

const palette = { color: '#25B995', darkColor: '#16856B', softColor: '#E7FAF4' };
export const applicationUnit: CourseUnit = {
  id: 'llm_application', title: 'Unit 2 · 大模型应用工程师', subtitle: 'RAG、Agent、评测与生产', description: '8 个 Section · 64 个节点 · 每节点 24 题',
  sections: sections.map((section, index): CourseSection => ({
    id: `app-section-${index + 1}`, title: `Section ${index + 1} · ${section.title}`, shortTitle: section.title, description: section.description, ...palette,
    nodes: section.topics.map(expandNode),
  })),
};

export const applicationNodes = applicationUnit.sections.flatMap((section) => section.nodes);
export const applicationTopics = sections.flatMap((section) => section.topics);

const coreKnowledge: KnowledgeCardInput[] = applicationTopics.map((topic) => ({
  id: `kb-${topic.id}`, domainId: 'llm', title: topic.title, interviewQuestion: `请解释${topic.title}的机制、指标和失败边界。`, aliases: [], difficulty: '高频', roles: ['llm_application'],
  summary: topic.core, answer: `${topic.core} 面试回答还应给出输入约束、分阶段指标、失败信号和可执行回退。`, intuition: `${topic.title}不是孤立组件，而是质量、时延、成本与安全共同约束的一段链路。`,
  keyPoints: [topic.core, '先建立可复现基线再优化。', '平均指标不能替代尾延迟和失败样本。'], followUps: ['如何建立基线？', '线上指标变化时如何定位？', '什么情况下不应采用更复杂方案？'], misconceptions: ['框架默认配置可以替代业务评测。'], sources: [topic.source],
}));

const supportKnowledge: KnowledgeCardInput[] = applicationTopics.slice(0, 34).map((topic) => ({
  id: `kb-${topic.id}-operations`, domainId: 'llm', title: `${topic.title}：指标与排障`, interviewQuestion: `${topic.title}线上异常时看哪些证据？`, aliases: [`${topic.title} 排障`], difficulty: '进阶', roles: ['llm_application'],
  summary: `围绕${topic.title}建立输入、质量、延迟、成本和错误五类观测信号。`, answer: `先固定请求、数据和版本，再沿调用链比较分阶段指标。把相关性或成功率与 P50/P95 延迟、token 成本和错误类型关联，最后用单变量消融验证根因。`, intuition: '先确定哪一段开始偏离基线，再讨论优化方案。',
  keyPoints: ['版本与输入可复现', '分阶段指标', '单变量消融'], followUps: ['需要记录哪些 trace 字段？', '怎样区分数据漂移与代码回归？'], misconceptions: ['只看一张总体成功率曲线即可定位。'], sources: [topic.source],
}));

const technologyTopics = [
  ['redis-llm', 'Redis 在大模型应用中的职责', 'Redis 适合缓存、会话状态、限流和幂等键；语义缓存还必须把知识版本与权限纳入键和失效策略。', 'https://redis.io/docs/latest/'],
  ['vllm-serving', 'vLLM 推理服务', 'vLLM 通过 PagedAttention、连续批处理、分块 prefill 和前缀缓存提高服务效率，但仍需独立的网关、扩缩容与故障处理。', 'https://docs.vllm.ai/en/latest/'],
  ['milvus-vector', 'Milvus 向量数据库', 'Milvus 将向量索引、标量过滤和分布式存储组合，选型时要验证索引参数、数据更新、分片与一致性。', 'https://milvus.io/docs'],
  ['faiss-index', 'FAISS 本地向量索引', 'FAISS 提供高效向量检索算法库，但权限、多租户、持久化和在线运维需要应用自行补齐。', 'https://github.com/facebookresearch/faiss'],
  ['elasticsearch-hybrid', 'Elasticsearch 混合检索', 'Elasticsearch 可在同一检索链路中组合 BM25、向量查询、过滤和 RRF，重点是候选规模与查询延迟。', 'https://www.elastic.co/guide/en/elasticsearch/reference/current/rrf.html'],
  ['langchain-boundary', 'LangChain 组件边界', 'LangChain 提供模型、检索器和工具等集成抽象；生产系统仍需自己定义状态、权限、观测和失败语义。', 'https://docs.langchain.com/oss/python/langchain/overview'],
  ['langgraph-state', 'LangGraph 状态与 Checkpoint', 'LangGraph 用图和显式状态组织长流程，Checkpoint 支持恢复和人在回路，但副作用仍需幂等。', 'https://docs.langchain.com/oss/python/langgraph/persistence'],
  ['fastapi-streaming', 'FastAPI、SSE 与 WebSocket', 'FastAPI 异步接口需要传播取消与超时；SSE 适合单向 token 流，WebSocket 适合双向实时控制。', 'https://fastapi.tiangolo.com/advanced/custom-response/'],
  ['containers-routing', 'Docker、Kubernetes 与 Nginx', '容器保证运行环境一致，Kubernetes 管理副本和健康状态，Nginx 或网关负责连接、路由和限流；三者职责不能混淆。', 'https://kubernetes.io/docs/concepts/'],
  ['otel-tracing', 'OpenTelemetry 链路追踪', 'OpenTelemetry 用 trace、span 和 context 关联检索、模型与工具调用，属性设计必须避免记录提示正文和敏感字段。', 'https://opentelemetry.io/docs/concepts/signals/traces/'],
  ['langfuse-observation', 'Langfuse 类 LLM 可观测平台', 'LLM 可观测平台聚合 prompt 版本、token、时延、评测与用户反馈，但不能替代底层服务指标和隐私治理。', 'https://langfuse.com/docs'],
  ['ragas-evaluation', 'RAGAS 分层评测', 'RAGAS 类方法帮助评估检索上下文与回答，但模型评审结果必须用人工样本校准并固定版本。', 'https://docs.ragas.io/'],
  ['mainland-model-apis', 'Qwen 与 DeepSeek API 边界', '接入不同模型时要验证结构化输出、工具调用、上下文、限流与错误码，不能假定 OpenAI 兼容接口的全部行为一致。', 'https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope'],
  ['mcp-security', 'MCP 能力与安全边界', 'MCP 解决能力发现和协议互通，不自动解决服务可信、用户授权、最小权限和工具结果校验。', 'https://modelcontextprotocol.io/specification/latest'],
] as const;

const technologyKnowledge: KnowledgeCardInput[] = technologyTopics.map(([id, title, summary, url]) => ({
  id: `kb-app-tech-${id}`, domainId: 'llm', title, interviewQuestion: `请说明${title}在大模型应用中的职责和边界。`, aliases: [], difficulty: '高频', roles: ['llm_application'], summary,
  answer: `${summary} 回答时应给出适用条件、关键指标、失败信号以及与相邻组件的职责划分。`, intuition: '工具解决特定工程问题，框架名称本身不是架构答案。', keyPoints: [summary, '用自有负载和数据验证。', '明确安全与故障边界。'], followUps: ['核心指标是什么？', '故障时如何降级？'], misconceptions: ['接入该工具即可自动获得生产可靠性。'], sources: [docs(title, url)],
}));

export const applicationKnowledgeCards = [...coreKnowledge, ...supportKnowledge, ...technologyKnowledge];

const interviewSources = [
  'https://www.nowcoder.com/discuss/882634966025175040',
  'https://www.nowcoder.com/discuss/880841659733311488',
  'https://www.nowcoder.com/discuss/878600528970735616',
];
export const applicationInterviewEvidence = applicationTopics.map((topic) => ({ nodeId: topic.id, role: 'llm_application' as const, retrievedAt: '2026-08-15', topicTags: [topic.title], sources: interviewSources.map((url) => ({ url, stage: 'technical-interview' })) }));
