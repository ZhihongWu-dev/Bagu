# Transformer 题库质量重构实施计划

## 目标

在不改变 25 个公共课程节点、解锁进度和 8/10/12 自适应会话的前提下，完成以下工作：

1. 建立可复现的题库质量数据模型、确定性检查和审题记录。
2. 建立命题、证据审题和命题质量审题相互隔离的开发流程。
3. 在 Expo Go 中提供仅测试阶段可见的手机标注模式和 JSON/CSV 导出。
4. 分五批重写全部 300 道 Transformer 公共题目。
5. 用 Agent 校准、手机人工标注和上线后的作答数据形成持续复审闭环。

本计划不部署腾讯云、不在移动端运行审题 Agent、不加入手写代码题，也不修改算法或应用岗位的专业题库。

## 已确认的技术决策

- Transformer 现有 12 道题由 `buildNode` 通用模板生成。重构后保留结构辅助函数，但公共课程内容改为逐题显式数据，不再从 `facts/traps/formula` 自动拼出完整题目。
- 题目运行时数据与审计材料分离。App 只打包答题所需字段、题目版本和认知层级；原子事实、来源位置、审题结论和评分记录保存在开发期 review manifest 中。
- 手机标注使用正式答题页面相同的题目与反馈渲染组件，但拥有独立状态和存储，不扣生命、不加 XP、不完成课程、不进入复习队列，也不发送产品分析事件。
- 标注入口使用 `__DEV__` 与 `EXPO_PUBLIC_ENABLE_QUESTION_REVIEW=true` 双重门禁。正式构建即使存在深链路也不能进入。
- 原生端用 Expo SDK 54 官方推荐的 `expo-sharing ~14.0.8` 分享缓存目录中的 JSON/CSV；Web 端生成浏览器下载，不依赖 Web Share API 分享本地 URI。
- Inspect AI 和 OpenAI Evals 只作为流水线与评分器设计参考，首版不引入 Python 运行时。`py-irt` 只在真实样本足够后用于离线分析，不成为 App 依赖。
- QGEval 仓库未显示清晰许可证，只参考论文公开的评价维度，不复制其代码或数据。

## 阶段 0：锁定基线

### 工作

- 记录现有 25 个节点、300 道公共题、题型分布、练习 ID 和公式使用情况。
- 运行现有 TypeScript、Lint、Expo Doctor、课程、数学、UI、学习、角色和分析测试。
- 将截图中的 `qkv-roles-07` 作为首个答案泄露回归样例。
- 建立题目 ID 迁移清单。节点 ID 全部保留；能力目标发生变化的练习使用 `节点ID-v2-序号`，旧 ID 记录为 retired。

### 产物

- `app/quality/transformer/baseline.json`
- `app/quality/transformer/id-migration.json`

### 基线退出条件

- 基线恰好包含 25 个节点和 300 道题。
- 所有旧练习 ID 唯一且能映射到节点。
- 现有测试在内容修改前全部通过，失败项先记录而不混入题库重写。

## 阶段 1：题目元数据与确定性质量门禁

### 数据模型

新增 `app/src/types/question-quality.ts`：

- `QuestionCognitiveLevel`: `foundation | application | deep`
- `QuestionVersion`
- `AtomicClaimReview`
- `QuestionEvidenceManifest`
- `QuestionReviewVerdict`: `pass | revise | reject | uncalibrated`
- `AnchoredQualityScore`
- `QuestionReviewRecord`

在 `app/src/types/course.ts` 的 `ExerciseBase` 增加公共题所需的轻量字段：

- `questionVersion?: number`
- `cognitiveLevel?: QuestionCognitiveLevel`
- `learningObjectiveId?: string`

这些字段对现有算法与应用题暂时可选，但 Transformer v2 题目由验证器强制要求。

### 显式题目构造

- 新增 `app/src/data/transformer/question-builders.ts`，只负责单选、多选、排序和口述题的类型安全组装，不生成题干、选项、解析或正确答案。
- `app/src/data/transformer/build-node.ts` 在迁移期间只服务尚未重写的 Section；每完成一批即减少调用范围，五批完成后移除公共课程对它的依赖。
- review manifest 放在 `app/quality/transformer/manifests/`，不从 App 源代码导入，避免审计文本增加移动包体。

### 验证器

新增：

- `app/scripts/question-quality/normalize.ts`
- `app/scripts/question-quality/rules.ts`
- `app/scripts/validate-question-quality.ts`
- `app/scripts/test-question-quality.ts`
- `app/scripts/fixtures/question-quality/`

确定性规则至少覆盖：

- 25 节点、每节点 12 题和严格 3/6/3 层级配额；
- v2 元数据、manifest 和来源覆盖完整；
- 题目、选项、答案、解析结构合法；
- 顶部公式、题干和正确选项规范化后不存在直接答案泄露；
- 选项完全重复、题干高重复和跨题表面改写；
- 选项长度异常、答案位置长期偏置和占位措辞；
- 单选答案唯一、多选答案非空、排序答案为完整排列；
- 审题记录包含六项硬门槛和 0–4 锚定评分；
- `pass` 题目总分至少 13/16 且单项不低于 2。

质量测试 fixture 必须包含“完整公式同时出现在题面和正确选项”的缺陷，并验证规则能拦截截图对应模式。

### 脚本

在 `app/package.json` 增加：

- `validate:questions`
- `test:question-quality`
- `validate:question-reviews`

### 质量门禁退出条件

- 每条规则至少有一个通过样例和一个失败样例。
- 验证器输出题目 ID、失败规则和可执行原因，不只输出总分。
- Transformer v1 迁移期间允许明确列入 retired/baseline 的旧题存在，但 v2 正式题不得绕过门禁。

## 阶段 2：审题 Agent 工作流与金标准校准

### 仓库结构

新增：

- `app/quality/transformer/README.md`
- `app/quality/transformer/schemas/question-review.schema.json`
- `app/quality/transformer/prompts/evidence-reviewer.md`
- `app/quality/transformer/prompts/item-quality-reviewer.md`
- `app/quality/transformer/gold/gold-set.json`
- `app/quality/transformer/reviews/<section>/<exercise-id>.json`
- `app/scripts/evaluate-review-calibration.ts`

### 角色约束

- 命题角色提交题目、能力目标、原子事实和来源，但不能修改审题输出。
- 证据审题角色只核验事实、答案唯一性、条件、来源和反例。
- 命题质量角色只核验泄露、深度、干扰项、清晰度、解析对齐和重复。
- 两个审题角色使用隔离上下文，不读取命题隐藏推理，输出必须符合 JSON Schema。
- Reviewer 结论冲突时自动标记 `revise`，不由命题角色自行裁决。

### 金标准

- 创建 30 道合格样例与 30 道人工植入缺陷样例。
- 缺陷覆盖事实错误、多解、隐藏条件、答案泄露、无效干扰项、解析矛盾和重复。
- 先由项目流程生成候选标签；涉及 Transformer 技术事实的最终 gold 标签必须由熟悉该领域的人员确认。
- 在技术人员确认之前，校准状态写为 `uncalibrated`，Agent 只能建议修改，不能作为发布批准依据。

### 校准指标

`evaluate-review-calibration.ts` 输出：

- 致命问题召回率，目标至少 95%；
- 错误放行率，目标不高于 5%；
- 与 gold 标签一致率，目标至少 90%；
- 相同输入重复运行一致率，目标至少 90%；
- 按缺陷类别拆分的漏检清单。

### Agent 校准退出条件

- Schema、prompts、gold set 和校准报告均进入版本控制。
- 未校准状态无法被验证器解释为 `pass`。
- 审题失败保留具体证据，不用整体印象或无依据的分数替代。

## 阶段 3：共用题目渲染与手机标注模式

### 共用渲染重构

从 `app/src/app/lesson/[id].tsx` 抽取：

- `app/src/components/exercise-prompt.tsx`
- `app/src/components/exercise-response.tsx`
- `app/src/components/exercise-feedback.tsx`

正式课程与标注页共用这些组件。状态、生命值、声音、分析和导航仍由各自页面控制，组件只接收题目、选择状态和回调。

先为抽取后的答题正确性、排序、多选和公式渲染补回归测试，再接入标注页，避免为标注功能改变正式练习行为。

### 标注数据

新增：

- `app/src/question-review/types.ts`
- `app/src/question-review/annotation-data.ts`
- `app/src/question-review/export.ts`
- `app/src/storage/question-annotation-storage.native.ts`
- `app/src/storage/question-annotation-storage.ts`

每条 `QuestionAnnotation` 包含：

- 题目 ID、题目版本、Section、标注时间；
- 选择结果、是否正确、作答时长；
- 作答依据：推理、记忆、题面提示、排除后猜测、完全猜测；
- 清晰度、多解判断、干扰项可信度、提示类型、解析帮助程度、难度；
- 可选问题说明。

存储键与 `bagu-progress-v1` 完全分离。归一化时过滤未知枚举、过长说明和无效题目版本。自由说明仅本地保存，不进入匿名产品分析队列。

### 标注页面

新增 `app/src/app/question-review.tsx`：

- 只在 `__DEV__ && EXPO_PUBLIC_ENABLE_QUESTION_REVIEW === 'true'` 时可访问；否则返回课程主页。
- 可选择 Section，只显示已经通过自动检查和 Agent 预审的题目。
- 默认跳到当前 Section 第一条未标注题目，显示 `已标注/总题数`。
- 先正常答题，提交后展示与正式课程一致的反馈，再展示结构化标注控件。
- 未完成必填标注不能进入下一题；可回看和修改已标注记录。
- 不使用生命值、XP、streak、课程完成、复习队列或产品 analytics。
- 提供清除当前 Section 标注、导出 JSON、导出 CSV，清除前必须二次确认。

在 `app/src/app/(tabs)/profile.tsx` 增加仅开发模式可见的“题库标注”入口，不加入正式底部导航。

### 导出

- 运行 `npx expo install expo-sharing`，锁定 SDK 54 兼容版本。
- 原生端通过 `File(Paths.cache, ...)` 写入导出文件，经 `Sharing.isAvailableAsync()` 检查后调用 `shareAsync()`。
- Web 端使用 Blob 与临时下载链接，不尝试分享本地 URI。
- CSV 实现 RFC 4180 风格的逗号、引号和换行转义，并用单元测试覆盖中文说明。

### 测试

新增：

- `app/scripts/test-question-annotations.ts`
- `app/scripts/test-question-export.ts`

覆盖数据归一化、版本共存、保存后恢复、必填字段、CSV 转义、JSON 往返和进度统计。

### 手机标注工具退出条件

- iPhone Expo Go 中可连续完成 10 道标注并在重启后恢复。
- 导出的 JSON/CSV 均包含相同记录数和题目版本。
- 标注一轮后课程进度、生命、XP、streak、复习队列和 analytics 队列均不变化。
- 生产导出中看不到入口，直接访问路由也无法进入。

## 阶段 4：Section 1 的 60 道题重写

### 范围

节点：

1. `qkv-roles`
2. `attention-shapes`
3. `scaled-dot-product`
4. `softmax-attention`
5. `attention-masks`

### 文件组织

新增：

- `app/src/data/transformer/questions/attention/qkv-roles.ts`
- `app/src/data/transformer/questions/attention/attention-shapes.ts`
- `app/src/data/transformer/questions/attention/scaled-dot-product.ts`
- `app/src/data/transformer/questions/attention/softmax-attention.ts`
- `app/src/data/transformer/questions/attention/attention-masks.ts`
- `app/quality/transformer/manifests/attention/*.json`

修改 `app/src/data/transformer/attention-section.ts`，保留节点标题、图标、知识库关联和顺序，改为导入显式题目数组，不再调用通用内容生成模板。

### 内容流程

对每个节点依次完成：

1. 定义 4–6 个原子能力目标。
2. 建立原始论文、官方文档和实现的 claim/source 映射。
3. 编写 3 道基础、6 道应用、3 道深挖题。
4. 为每个干扰项记录真实误区和不成立条件。
5. 运行质量门禁、数学公式验证和课程验证。
6. 证据审题角色与命题质量角色分别输出 review JSON。
7. 修订所有 `revise/reject` 题，直到达到预审要求。

`qkv-roles-v2-07` 必须用维度、参数共享或错误诊断取代“展示公式后选择同一公式”，并加入答案泄露回归测试。

### Section 1 候选题退出条件

- Section 1 恰好 60 道 v2 题，严格满足 15 道基础、30 道应用、15 道深挖。
- 每题通过六项硬门槛与 13/16 质量门槛。
- 所有 manifest 和双角色审题记录齐全。
- 旧 60 题退出正式抽题池，但节点完成进度保持不变。
- 8/10/12 三种会话和错题复练继续正常。

## 阶段 5：Section 1 手机全量标注与返工

### 用户操作

- 提供启用标注模式的 Expo Go 二维码。
- 用户每次完成 10 道，共 6 次完成 Section 1 的 60 道题。
- 用户导出 JSON；CSV 用于人工查看，JSON 作为自动汇总输入。

### 汇总与返工

新增 `app/scripts/summarize-question-annotations.ts`，输出：

- 答案泄露、多解、多个弱干扰项和解析无效的阻塞清单；
- 难度、作答依据、正确率和耗时分布；
- 每道题最新版本是否已完成标注；
- 需要重新标注的修订题列表。

阻塞题修改后增加题目版本，再经过确定性检查、双角色审题和手机复核。Section 1 未清零阻塞项时不得进入完成状态。

## 阶段 6：Sections 2–5 分批迁移

按以下顺序逐批重复阶段 4 和阶段 5，每批 60 题：

1. Block 与归一化：`block-section.ts`
2. 位置编码与长上下文：`position-section.ts`
3. 模型架构与训练目标：`architecture-section.ts`
4. 推理与系统效率：`inference-section.ts`

每一批都必须独立完成来源映射、60 题显式重写、自动检查、双角色审题、手机全量标注、返工和三种会话测试。禁止先生成剩余 240 题再统一审核。

最后一批完成后：

- `app/src/data/transformer/build-node.ts` 不再负责公共课程内容，可保留给其他数据或拆除未使用代码。
- 300 道 v1 旧题全部 retired，300 道 v2 题成为唯一公共正式题池。
- 运行一次跨 Section 重复、答案位置和能力覆盖总审计。

## 阶段 7：上线后的题目测量闭环

该阶段依赖匿名分析后端部署，不阻塞本地题库重写。

### 事件协议

在用户明确同意匿名分析的前提下，为 `exercise_answered` 增加：

- `question_version`
- `selected_choice_ids`：按用户选择顺序用 `|` 连接的选项 ID，例如 `a|c`；自我回忆题省略该字段

不上传题干、选项文本、自由标注、简历或身份信息。更新 `app/src/analytics/protocol.ts` 和 `app/scripts/test-analytics.ts`，继续拒绝任何白名单外字段。

### 离线分析

新增离线脚本导出：

- 题目正确率与置信区间；
- 点二列相关；
- 每个干扰项选择率；
- 首次与重复作答差异；
- 作答时长与退出异常；
- 按题目版本拆分的数据。

样本量和覆盖足够后，单独建立 Python 分析目录并评估 MIT 许可的 `py-irt`。IRT 输出只做复审排序，必须标注自适应抽题、重复练习和选择偏差，不能自动决定题目正确与否。

## 阶段 8：最终验证

### 自动测试

在 `app/` 运行：

```text
npm run test:question-quality
npm run validate:questions
npm run validate:question-reviews
npm run test:question-annotations
npm run test:question-export
npm run test:learning
npm run test:roles
npm run test:analytics
npm run test:application
npm run validate:content
npm run validate:math
npm run validate:ui
npx tsc --noEmit
npm run lint
npx expo-doctor
```

### 平台验证

- 导出 Web、iOS、Android 三个平台。
- iPhone Expo Go 验证正式课程 8/10/12 会话、生命归零、错题复练和完成结算。
- iPhone Expo Go 验证 10 道连续标注、重启恢复、修改记录、JSON/CSV 分享和清除确认。
- 检查长中文选项、KaTeX 公式、反馈面板和标注控件无截断、重叠或布局跳动。
- 关闭标注环境变量重新导出，确认正式界面和深链路均无法访问标注模式。

## 实施检查点

本计划包含必须等待人工输入的检查点，不能一次自动完成：

1. **工具检查点**：手机标注模式完成后，用户先试标 10 道，确认字段和交互可用。
2. **技术金标准检查点**：熟悉 Transformer 的人员确认金标准中的事实标签；确认前 Agent 保持 `uncalibrated`。
3. **每批人工检查点**：用户完成当前 60 道手机标注并导出结果。
4. **每批发布检查点**：阻塞题返工和复核全部清零后才能迁移下一 Section。

实施开始后，先完成阶段 0–3 和 Section 1 的候选题，不提前改写后四个 Section。这样可以先用真实标注结果验证评价体系，再扩大到全部 300 题。

## 风险与控制

- **Agent 相关性**：不同角色仍可能共享模型盲点。通过隔离上下文、结构化证据、金标准校准和人工复核控制，禁止 Agent 自批。
- **用户不是技术审稿人**：手机标注只负责清晰度、提示、难度和解析价值，不能替代事实金标准。
- **显式题目文件过大**：每个节点单独文件，每批只修改一个 Section，避免再次形成大型生成器。
- **练习 ID 变化**：节点进度不受影响，但旧的单题使用次数不会迁移到 v2；通过版本化 ID 和 retired 清单明确处理。
- **标注污染正式数据**：独立路由、独立存储、独立导出且不调用 Progress/Analytics 写接口。
- **导出兼容性**：原生以 Expo Go 支持的 `expo-sharing` 为主；Web 使用下载兜底，不依赖 HTTPS Web Share。
- **题库测量样本不足**：早期只报告描述性指标，不提前声称 IRT 参数可靠。

## 参考实现的采用边界

- Inspect AI：借鉴 dataset/solver/scorer 分离、多个 scorer 和结构化日志；不直接引入其 Python 依赖。
- OpenAI Evals：借鉴固定数据集、gold label 和回归评测；不上传 Bagu 私有题库。
- QGEval：借鉴多维人工评价思路；许可证不明确，不复制代码或数据。
- py-irt：后期离线分析候选，MIT 许可；样本不足时不采用。
- Expo Sharing/FileSystem：按 SDK 54 官方文档使用，保持 Expo Go 兼容。
