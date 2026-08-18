# 牛客公开内容信号采集实施计划

## 目标

实现一个位于 App 运行时之外的本地 TypeScript 研究工具，完成 100 个牛客公开页面的受控试采：面经与选择题页面各约 50 个。工具只输出岗位、年份、考点、追问、误区和选择题质量信号，不保存原帖正文、原始题干、完整选项、用户身份或联系方式，也不自动生成或发布题目。

本计划以设计文档 `docs/superpowers/specs/2026-08-17-nowcoder-public-signal-intake-design.md` 为唯一产品边界。

## 已确认的技术决策

- 工具代码放在 `app/scripts/nowcoder-intake/`，复用现有 TypeScript/tsx 工具链，但不从 `app/src/` 导入，也不进入 Expo 包。
- 使用 Node 内置 `fetch` 发起请求，使用 `@mozilla/readability` 与 `jsdom` 做无脚本正文抽取，使用 `robotstxt-util` 解析 RFC 9309 规则。
- 新依赖只作为 `devDependencies` 安装。实施前通过 `npm view` 再确认当前 Node 要求、许可证和最近版本，锁定与仓库 Node 环境兼容的版本。
- 第一版不使用 LLM、搜索引擎爬虫、浏览器登录态、代理、无头浏览器或 CloudBase。
- 搜索引擎候选发现由研究阶段完成，代码只读取本地候选清单；候选链接未经人工改为 `approved` 时不能请求正文。
- CLI 默认无网络。真实访问必须同时提供 `--allow-network`、批准清单和批次上限。
- `robots.txt` 无法获取、无法解析或规则不明确时失败关闭，状态为 `robots_unavailable`。
- HTML 和正文只存在于进程内存；运行输出目录默认进入 `.gitignore`，人工确认后再决定是否保留结构化候选包。

## 阶段 0：环境与依赖基线

### 工作

1. 在 `app/` 记录 Node、npm、Expo 与 TypeScript 版本。
2. 运行现有 TypeScript、lint、Expo Doctor 和全部内容/题库测试，记录与本工具无关的既有 warning。
3. 查询以下包的当前版本、Node 要求、许可证、维护活动与安全公告：
   - `@mozilla/readability`；
   - `jsdom`；
   - `@types/jsdom`；
   - `robotstxt-util`。
4. 使用 `npm install --save-dev` 安装兼容版本，不升级 Expo、React Native 或其他直接依赖。
5. 运行 `npm audit`，区分新增依赖引入的问题和现有 Expo/Metro 工具链问题；禁止运行破坏性 `npm audit fix --force`。

### 退出条件

- 依赖许可证允许仓库使用；
- Node 版本满足依赖要求；
- 安装后 `npx expo-doctor`、`npx tsc --noEmit` 和现有测试结果不退化；
- `package-lock.json` 只包含预期依赖变化。

## 阶段 1：目录、Schema 与清单门禁

### 新增文件

```text
app/quality/nowcoder-intake/
  README.md
  manifests/pilot-100.json
  schemas/source-manifest.schema.json
  schemas/source-signal.schema.json
  schemas/intake-report.schema.json
  fixtures/

app/scripts/nowcoder-intake/
  types.ts
  config.ts
  manifest.ts
  url-policy.ts
  cli.ts
```

### 数据模型

`SourceManifestEntry`：

- `sourceId`：稳定、非语义唯一 ID；
- `url`：规范化前的公开 HTTPS URL；
- `pageType`：`interview | multiple-choice`；
- `approvalStatus`：`discovered | approved | rejected`；
- `discoveryQuery`；
- `discoveredAt`；
- 可选 `reviewNote`。

`SourceSignal`：

- 来源 ID、规范化 URL、页面类型、采集时间和 SHA-256 内容哈希；
- 岗位标签、招聘阶段、年份；
- 标准化考点 ID；
- 追问类型、误区类型；
- 选择题页面的认知层级、干扰项错误类型和答案线索类型；
- 置信度和人工复核状态。

禁止在 `SourceSignal` Schema 中出现 `rawHtml`、`rawText`、`excerpt`、`questionText`、`choices`、`answerText`、`author`、`username` 等字段。

### URL 门禁

- 只允许 `https:`；
- 主机只允许 `www.nowcoder.com` 和经设计确认的同站公开主机；
- 移除 fragment，规范化默认端口和无语义追踪参数；
- 拒绝包含 Token、邮箱、手机号、session 或 auth 信息的查询参数；
- 拒绝带用户名/密码的 URL；
- 规范化 URL 唯一；
- `approved` 总数不超过 100；
- 未批准清单运行 CLI 时必须是无网络 dry-run。

### 测试先行

新增 `app/scripts/test-nowcoder-intake.ts`，先写失败用例：

- HTTP URL 被拒绝；
- 非允许域名被拒绝；
- 敏感参数被拒绝；
- fragment 和追踪参数规范化；
- 重复 URL 被拒绝；
- 101 个批准链接被拒绝；
- `discovered` 链接不能进入请求队列；
- 输出 Schema 拒绝原文与个人字段。

### 退出条件

- 清单和三类输出 Schema 可由脚本验证；
- 默认 `pilot-100.json` 不包含已批准真实 URL；
- 单元测试在无网络环境通过；
- CLI 在缺少 `--allow-network` 时无法调用抓取器。

## 阶段 2：robots、请求安全与限速

### 新增文件

```text
app/scripts/nowcoder-intake/
  robots-policy.ts
  fetch-page.ts
  rate-limiter.ts
  stop-policy.ts
```

### robots 策略

- 每个 origin 在批次内最多获取一次 `/robots.txt`；
- 使用明确 User-Agent，并同时遵循匹配该 User-Agent 和 `*` 的适用规则；
- 尊重 `Disallow` 和可解析的 `crawl-delay`；
- 无法获取、非成功响应、超出大小或无法解析时返回 `robots_unavailable`；
- 禁止因为 robots 获取失败而回退为允许。

### 请求策略

- 单线程，禁止并发；
- 页面请求间隔随机落在 8–12 秒；若 robots 要求更长间隔则取更严格值；
- 单请求连接和总体超时；
- HTML 响应大小上限；
- 最多有限次重定向，每次重定向重新执行 URL 门禁；
- 重定向到非允许主机、非 HTTPS 或私网/本机目标时返回 `redirect_blocked`；
- 不发送 Cookie、Authorization、Referer 或浏览器指纹头；
- 网络错误最多重试一次，重试仍需经过限速器；
- 响应不是 HTML 时返回 `unsupported_page`。

### 停止策略

- 处理或明确拒绝 100 个批准页面后停止；
- 连续 10 个页面触发访问控制后停止；
- 最近 20 页中网络或解析失败超过 50% 时停止；
- 支持 `AbortSignal` 和操作员中止；
- 停止时仍输出当前报告。

### 测试先行

使用本地 HTTP 服务和注入式 clock/fetch，不访问外网：

- robots allow/disallow；
- robots 404、超时、过大和语法失败均保守拒绝；
- 8–12 秒间隔与更严格 crawl-delay；
- 请求串行；
- Cookie/Authorization 不存在；
- 重定向重新校验；
- 私网重定向拒绝；
- 超时、大小、Content-Type 和单次重试；
- 三类停止条件。

### 退出条件

- 测试能证明抓取器默认失败关闭；
- 测试期间没有外部 DNS 或 HTTP 请求；
- 所有请求都经过同一个限速和重定向门禁。

## 阶段 3：页面识别、正文抽取与脱敏

### 新增文件

```text
app/scripts/nowcoder-intake/
  page-classifier.ts
  extract-article.ts
  redact.ts
  content-hash.ts

app/quality/nowcoder-intake/fixtures/
  interview-public.html
  multiple-choice-public.html
  login-required.html
  captcha.html
  paywalled.html
  pii-heavy.html
  duplicate-a.html
  duplicate-b.html
```

Fixtures 必须是人工构造的最小 HTML，不复制牛客页面正文或题目。

### 页面识别

- 用 URL 形态、标题和 DOM 标记共同确认页面类型；
- 登录、验证码、付费、异常提示优先于正文识别；
- 页面类型与清单声明不一致时返回 `unsupported_page`；
- 内容太短、只有导航或没有有效技术信号时返回 `insufficient_signal`。

### 正文抽取

- `jsdom` 禁止脚本执行和外部资源加载；
- Readability 只返回进程内 `textContent` 和必要元数据；
- 不保存 Readability 的 HTML、excerpt、byline 或调试输出；
- DOM 与正文引用在单页处理后释放；
- 内容哈希基于规范化、脱敏前的正文计算，仅保存 SHA-256。

### 脱敏

- 识别手机号、邮箱、微信号、QQ 号、群链接、内推码和常见联系方式提示；
- 删除简历段落、昵称/作者区和不影响技术主题判断的人员信息；
- 下游接口只能接受脱敏后的临时文本；
- 输出构造采用字段白名单，禁止通用对象扩展或原文透传；
- 输出前再次执行 PII 和禁止字段扫描，失败则整条来源不落盘。

### 测试先行

- fixtures 中的脚本不会执行；
- 外部图片、iframe 和样式不会请求；
- 登录/验证码/付费页面准确拒绝；
- Readability 提取到主内容而非导航；
- PII fixture 中每类标识均被删除；
- 输出对象 JSON 序列化后不包含 fixture 原句；
- 轻微排版差异产生相同规范化内容哈希；
- 重复内容只贡献一次主题频率。

### 退出条件

- 原始 HTML 和正文没有任何写盘路径；
- 脱敏失败会阻止该来源进入成功输出；
- 所有安全和隐私用例通过。

## 阶段 4：考点分类与候选包

### 新增文件

```text
app/scripts/nowcoder-intake/
  topic-taxonomy.ts
  classify-role.ts
  extract-signals.ts
  aggregate.ts
  export.ts
```

### 初始考点分类

建立显式、可审查的关键词与同义词表，至少覆盖：

- Transformer、Attention、位置编码、训练目标；
- SFT、LoRA、量化、对齐、RLHF、DPO、GRPO；
- 推理服务、KV Cache、vLLM、并发、吞吐、延迟和显存；
- RAG、Embedding、Rerank、向量数据库、Redis 和检索评测；
- Agent、工具调用、工作流、记忆、可靠性与安全；
- 模型评测、数据治理、幻觉、观测和故障排查。

分类器输出标准化 topic ID，不输出命中的原句。一个来源可以匹配多个考点，但每个考点在单一来源内只计数一次。

### 岗位与追问信号

- 岗位：`llm_algorithm | llm_application | shared | unknown`；
- 招聘阶段：`campus-autumn | campus-other | unknown`；
- 追问：原理、边界、排障、指标、系统设计、方案权衡；
- 误区：概念混淆、条件遗漏、因果倒置、复杂度误判、指标误用；
- 置信度由独立信号数量与冲突情况决定，不伪装为统计概率。

### 选择题信号

只在临时文本中分析：

- 基础、应用或深度认知层级候选；
- 干扰项错误类型；
- 答案位置、长度、措辞、格式或题干重复线索。

输出不包含题干、选项、答案文字和解析。

### 候选包

生成：

- `source-signals.jsonl`；
- `source-signals.csv`；
- `topic-summary.json`；
- `intake-report.json`；
- `rejected-sources.jsonl`。

CSV 必须防止公式注入：以 `= + - @` 开头的单元格需要安全前缀处理，并正确转义逗号、引号和换行。

### 测试先行

- 两个岗位及 shared/unknown 分类；
- 招聘阶段和年份；
- 同义词映射与单来源去重计数；
- 追问和误区分类；
- 选择题线索分类但无原文输出；
- JSONL/CSV/summary 计数一致；
- CSV 公式注入和 RFC 4180 转义；
- 输出 PII/禁止字段扫描；
- 同一内容哈希不会重复贡献统计。

### 退出条件

- 所有信号都能回溯到来源 URL；
- 候选包不包含原文或个人信息；
- 分类规则和输出统计可重复；
- 候选包没有导入 `app/src/data/` 的代码路径。

## 阶段 5：CLI、操作文档与 dry-run

### CLI 命令

在 `app/package.json` 增加：

```text
intake:validate
intake:dry-run
intake:run
test:intake
```

行为：

- `intake:validate`：验证清单、Schema、URL 和数量，不发网络请求；
- `intake:dry-run`：展示批准队列、robots URL、预期间隔和输出路径，不发网络请求；
- `intake:run -- --allow-network --max-pages N`：运行受控采集；
- `test:intake`：运行所有本地 fixture 和本地 HTTP 集成测试。

真实运行还必须要求：

- `--manifest <path>`；
- `--output <empty-directory>`；
- `--allow-network`；
- `--acknowledge-public-only`；
- `--max-pages`，且不能超过 100。

输出目录非空时拒绝运行，避免覆盖或混合不同批次。

### 文档

`app/quality/nowcoder-intake/README.md` 说明：

- 法律和版权边界；
- 候选发现与人工审批步骤；
- 所有 CLI 示例；
- 状态码含义；
- 如何审阅候选包；
- 如何中止和恢复；
- 禁止把输出直接转为正式题库。

### 退出条件

- 默认命令和测试均无网络；
- 操作员必须完成两项显式网络确认；
- dry-run 输出与实际批准队列一致；
- 中止后报告可读且不产生半行 JSONL。

## 阶段 6：候选发现与人工审批检查点

### 候选发现

使用搜索引擎研究工具组合以下查询维度，不编写搜索引擎爬虫：

- 大模型算法工程师 / LLM 算法 / 多模态算法；
- 大模型应用工程师 / RAG / Agent / 推理部署；
- 校招 / 秋招 / 应届；
- 面经 / 选择题；
- 近三年内容优先。

候选发现结果只写入 `pilot-100.json` 的 `discovered` 项。先执行 URL 去重和类型初判，不请求候选正文。

### 人工审批

生成审批 CSV，包含来源 ID、URL、页面类型、搜索词和发现日期。人工可批量改为：

- `approved`；
- `rejected`；
- 保持 `discovered`。

只有审批后的 JSON 清单可以进入下一阶段。目标为两类页面各约 50 个，但不为凑数批准边界不明确页面。

### 检查点

- 展示 100 个候选的域名、路径类型和去重统计；
- 运行 `intake:validate` 和 `intake:dry-run`；
- 用户确认批准清单后才允许第一次网络烟测；
- 未确认前不得运行 `intake:run`。

## 阶段 7：单页真实网络烟测

### 前置条件

- 用户已确认批准清单；
- 当天重新读取牛客 `robots.txt` 和公开规则；
- CLI 全部本地测试通过；
- 输出目录为空；
- 不使用登录态。

### 烟测步骤

1. 从批准清单选择一个公开面经页面；
2. 运行 `intake:run -- --allow-network --acknowledge-public-only --max-pages 1 ...`；
3. 检查 robots 决策、请求日志、状态码和停止行为；
4. 检查输出只包含 Schema 字段；
5. 对所有输出执行 PII、原句和禁止字段扫描；
6. 人工打开来源页面，比对考点概括是否失真；
7. 若存在边界问题，停止并返工，不扩大规模。

### 退出条件

- 单页请求符合 robots 与限速策略；
- 没有 Cookie、Token、脚本执行或额外资源请求；
- 输出无个人信息、原文、题干和选项；
- 人工确认结构化信号基本忠实；
- 用户明确批准进入小批量试采。

## 阶段 8：10 页小批量与 100 页试采

### 10 页小批量

- 面经和选择题各 5 页；
- 检查成功率、拒绝分布、分类准确性、重复率和 PII 扫描；
- 人工逐条复核 10 条信号；
- 任一隐私泄漏、原文落盘或访问限制异常立即停止。

### 100 页试采

只有 10 页小批量通过后运行。仍保持单线程和每页 8–12 秒，不提高并发。完成后输出：

- 来源终态分布；
- 两类页面数量；
- 两类岗位和 shared/unknown 数量；
- 考点频率与近年分布；
- 拒绝、重复、低信号和失败清单；
- 建议优先补题的考点，不生成题目正文。

### 人工验收

- 随机抽查至少 20 条成功信号；
- 复核全部 high-priority 考点；
- 检查所有拒绝代码是否合理；
- 检查输出中没有原题复刻或可还原的连续原句；
- 记录分类误差和需要扩充的词表。

## 阶段 9：最终验证

### 自动验证

在 `app/` 运行：

```text
npm run test:intake
npm run intake:validate
npm run intake:dry-run
npx tsc --noEmit
npm run lint -- --quiet
npx expo-doctor
npm run validate:content
npm run validate:questions
npm run validate:question-reviews
npm run test:question-quality
npm run test:annotations
npm run test:learning
npm run test:roles
npm run test:application
npm run test:analytics
npm run test:resume
git diff --check
```

### 验收标准

- 测试和 dry-run 不访问外网；
- 真实访问只能处理人工批准 URL；
- 100 页上限、单线程、限速、robots 和停止条件有自动测试；
- HTML 与正文无写盘路径；
- 所有输出通过 Schema、PII、原句和禁止字段扫描；
- 重复页面不重复贡献频率；
- 候选包统计可复现且来源可回溯；
- App 课程、题库、进度、analytics 和 Expo 构建不受影响；
- 实际输出不会自动进入版本控制或正式题库；
- 任何未通过项保留具体来源 ID、规则和原因。

## 实施顺序与提交边界

建议按以下提交拆分：

1. `chore: add controlled intake schemas and manifest validation`
2. `feat: add robots-aware rate-limited page fetcher`
3. `feat: add transient extraction and privacy redaction`
4. `feat: add interview signal taxonomy and exports`
5. `docs: add intake CLI and approval workflow`
6. `data: add reviewed Nowcoder pilot manifest`

前五个提交只实现和验证工具，不包含真实批量采集结果。第六个提交必须在候选链接人工审批后单独进行，便于审查来源和回滚。
