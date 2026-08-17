# 牛客人工面试信号标注模块实施计划

## 目标

实现一个只在开发电脑本机运行的人工标注模块，载入现有 59 条牛客候选来源，支持打开来源、标准化标注、跳过、自动恢复和结构化导出。模块不能读取牛客登录态或页面正文，不能把标注自动导入正式 App 或题库。

本计划以 `docs/superpowers/specs/2026-08-17-nowcoder-manual-signal-annotation-design.md` 为唯一产品边界。

## GitHub 调研结论

实施前核对了三个一手参考：

- [HumanSignal/label-studio](https://github.com/HumanSignal/label-studio)：Apache-2.0，2026 年仍持续发布。其顺序标注、固定标签、进度和结构化导出模式可借鉴；但完整项目包含账户、数据库、项目管理、Webhook 和外部存储，且公开 issue 中存在 SSRF、IDOR 等多用户服务安全问题，不适合直接嵌入本地单人工具。
- [doccano/doccano](https://github.com/doccano/doccano)：MIT，最新发布为 2026 年，仍在维护。其文本分类、多标签、移动适配和 JSON/CSV 导出验证了工作流可行性；但 Python、数据库、任务队列和 REST API 对 59 条单人标注过重。
- [nodejs/node](https://github.com/nodejs/node)：MIT，持续维护。使用稳定的 `node:http` 与 `node:fs` 接口实现回环服务、请求体限制和同目录原子替换，不引入新的运行时服务框架。

本项目只复用交互和边界思想，不复制上述项目代码或资产。当前实现不增加第三方依赖，复用仓库已有的 TypeScript、`tsx` 和 `jsdom` 开发工具。

## 已确认的技术决策

- 新模块位于 `app/scripts/nowcoder-annotation/`，不进入 `app/src/` 和 Expo bundle。
- 只从现有采集模块复用候选清单类型与清单读取校验，不导入 fetch、Cookie、正文解析或网络采集能力。
- 服务使用 Node 内置 `http`，只监听 `127.0.0.1`；默认端口可配置，端口冲突时明确报错。
- 浏览器界面使用静态 HTML、CSS 和小型 ES module JavaScript，不增加前端构建器或通用标注框架。
- 标注保存在 `app/quality/nowcoder-intake/manual-data/annotations.json`；该目录默认被 Git 忽略。
- 服务端是数据模型的唯一校验和持久化入口；浏览器校验只改善体验，不能替代服务端门禁。
- 外部链接只由浏览器执行普通新标签页跳转，界面不嵌入 iframe、不发起牛客请求、不读取剪贴板。
- 导出按当前标注数据确定性重建，不把旧导出作为输入。

## 阶段 0：基线与文件边界

### 工作

1. 记录 Node、npm、TypeScript、Expo 和现有依赖状态。
2. 运行现有 TypeScript、lint、Expo Doctor、内容、题库、标注和牛客采集测试，记录既有 warning。
3. 核对 `pilot-100.json` 当前为 59 个唯一来源，并锁定测试基线。
4. 检查新模块不能从以下路径导入：
   - `app/scripts/nowcoder-intake/fetch-page.ts`；
   - `app/scripts/nowcoder-intake/extract-article.ts`；
   - App analytics、CloudBase 和正式题库模块。

### 退出条件

- 基线测试结果已记录；
- 新模块目录、数据目录和正式 App 的所有权边界明确；
- 没有新增依赖或无关升级。

## 阶段 1：数据模型、枚举和校验

### 新增文件

```text
app/scripts/nowcoder-annotation/
  types.ts
  taxonomy.ts
  validation.ts

app/quality/nowcoder-intake/schemas/
  manual-annotation.schema.json

app/scripts/
  test-nowcoder-annotation.ts
```

### 数据模型

建立 `ManualAnnotationDataset`：

- `schemaVersion: 1`；
- `manifestVersion`；
- `annotations`，以 `sourceId` 为稳定键；
- 每条记录包含 `status`、`relevance`、`role`、`recruitingStage`、标准化标签、短概括、跳过原因和 `updatedAt`。

固定枚举复用设计文档中的：

- 岗位与招聘阶段；
- 11 个既有 `TopicId`；
- 6 类追问；
- 5 类常见误区；
- 选择题认知层级、干扰项问题和答案线索；
- 跳过原因：`login-unavailable | page-missing | insufficient-content | irrelevant | duplicate | cannot-assess | other`。

### 服务端校验

- Schema 和运行时校验都拒绝额外字段；
- `sourceId` 必须存在于当前 manifest；
- `completed` 且 `relevant` 必须提供岗位和至少一个考点；
- 相关选择题必须提供认知层级；
- `completed` 且 `not-relevant` 或 `uncertain` 不要求岗位和考点，并清除不应计数的标签；
- `skipped` 必须提供跳过原因，且不会携带完成态标签；
- 数组去重并使用固定枚举顺序规范化；
- `summary` 去除首尾空白，最多 100 个 Unicode 字符；
- 手机号、邮箱、微信、QQ 等明显个人信息命中时拒绝保存；
- 未知枚举、非法时间、非法状态组合和未知来源全部失败关闭。

### 测试先行

先写失败用例，再实现校验：

- 59 个来源能加载且 ID 唯一；
- 未知来源和额外字段被拒绝；
- 相关完成态缺岗位、考点或相关性被拒绝；
- 无关和不确定完成态不要求岗位或考点，且不贡献统计；
- 选择题缺认知层级被拒绝；
- 跳过状态有多余标签被拒绝；
- 100 字边界通过，101 字失败；
- 邮箱、手机、微信和 QQ 样例被拦截；
- 合法中文短概括通过；
- 重复标签被规范化且顺序稳定。

### 退出条件

- Schema 与运行时校验表达同一组约束；
- 测试不访问网络、不读取浏览器状态；
- 数据模型不存在题干、选项、答案、正文、Cookie 或账号字段。

## 阶段 2：原子存储、恢复和导出

### 新增文件

```text
app/scripts/nowcoder-annotation/
  store.ts
  aggregate.ts
  csv.ts
  export.ts
```

### 存储行为

- 数据文件不存在时返回空数据集，不提前创建垃圾文件；
- 首次保存时创建 `manual-data` 目录；
- 同一进程内使用串行写入队列，避免快速连续保存互相覆盖；
- 写入同目录临时文件，刷新并重命名替换目标文件；
- 解析失败时不覆盖原文件，并报告可定位错误；
- 启动时忽略不完整临时文件，但不删除损坏的正式文件；
- 更新单条记录时保留其他来源记录，并覆盖该来源的旧版本；
- 恢复点是候选清单顺序中的首个 `pending` 来源，全部完成时保持在最后一次查看项。

### 确定性导出

生成：

```text
manual-data/exports/<timestamp>/
  annotations.json
  annotations.csv
  topic-summary.json
  annotation-report.json
```

- JSON 字段和数组顺序稳定；
- CSV 使用 UTF-8、RFC 4180 转义，并对 `= + - @` 开头的单元格加安全前缀；
- 汇总按岗位、考点、追问类型和页面类型计数；
- 同一来源对同一标签最多贡献一次；
- `pending`、`skipped`、`not-relevant` 和 `uncertain` 不贡献高频考点；
- 报告保留它们作为总数和状态分布。

### 测试先行

- 空数据集、首次保存、更新和重启恢复；
- 两次快速保存不丢记录；
- 写入失败后旧文件仍可解析；
- 损坏文件拒绝覆盖；
- 首个未完成位置和全完成位置；
- JSON/CSV/汇总/报告计数一致；
- 中文、引号、逗号、换行和公式注入；
- 跳过、无关和不确定不贡献频次；
- 重复标签不重复计数；
- 两次相同输入产生语义一致的导出。

### 退出条件

- 进度可跨进程恢复；
- 任一失败不会静默丢失已有标注；
- 导出没有原文和敏感字段。

## 阶段 3：回环 HTTP 服务与安全门禁

### 新增文件

```text
app/scripts/nowcoder-annotation/
  server.ts
  routes.ts
  security.ts
```

### 路由

- `GET /`、`GET /styles.css`、`GET /app.js`：固定静态资源；
- `GET /api/bootstrap`：候选最小字段、标签字典、当前标注和进度；
- `PUT /api/annotations/:sourceId`：校验并保存单条记录；
- `POST /api/export`：创建完整导出目录并返回相对路径；
- 其他方法或路径返回明确的 `404` 或 `405`。

### 安全门禁

- 明确调用 `listen(port, '127.0.0.1')`；
- 只接受当前服务端口对应的 `Host` 和同源 `Origin`；
- 写请求必须使用 `application/json`，请求体设置较小硬上限；
- 禁止 CORS，不返回通配来源；
- 设置 CSP：仅允许自身脚本、样式和连接，禁止 frame 和 form；
- 设置 `Referrer-Policy: no-referrer`、`X-Content-Type-Options: nosniff` 和禁止嵌入响应头；
- 静态资源使用固定映射，不能把 URL 路径转换为任意文件路径；
- 服务端没有任何外部 HTTP 客户端调用；
- `SIGINT` 和正常关闭等待当前保存完成。

### 测试先行

使用随机空闲端口启动本地测试服务：

- 实际监听地址是 `127.0.0.1`；
- bootstrap 只返回允许字段和 59 条来源；
- 非法 Host、跨源 Origin、错误 Content-Type、过大请求和未知路由被拒绝；
- 合法保存可恢复；
- 非法保存不会改变文件；
- 静态路径穿越失败；
- 导出路由生成四个一致文件；
- 测试期间没有任何牛客或其他外网请求。

### 退出条件

- 局域网地址无法绑定或访问服务；
- 服务无法充当代理、抓取器或任意文件服务器；
- 所有写入仍经过阶段 1 校验和阶段 2 原子存储。

## 阶段 4：浏览器标注界面

### 新增文件

```text
app/scripts/nowcoder-annotation/ui/
  index.html
  styles.css
  state.js
  app.js
```

### 界面结构

- 顶部固定显示总数、已完成、待处理和跳过；
- 桌面宽屏为左侧来源列表、右侧当前表单；
- 窄屏转为单列，来源筛选与表单不横向溢出；
- 来源列表可筛选全部、待处理、已完成和跳过；
- 当前来源显示 ID、页面类型、发现关键词和人工/自动状态，但不显示正文；
- “打开来源”使用 `target="_blank"`、`noopener`、`noreferrer`；
- 表单按岗位、考点、追问、误区和选择题信号分组；
- 选择题专属字段只在对应页面类型且相关时出现；
- 短概括显示剩余字数，不支持富文本、附件和大段输入；
- 保存失败时保留全部本地表单状态；
- “保存并下一条”优先进入下一个未完成来源；
- 导出成功后显示本机相对路径。

### 交互状态

`state.js` 只负责纯状态转换：

- 计算进度；
- 找到首个和下一个未完成来源；
- 按状态筛选；
- 将服务端记录映射为表单；
- 构造最小保存 payload；
- 选择页面时防止未保存修改静默丢失。

`app.js` 负责 DOM 渲染和 API 调用。所有候选文字通过 `textContent` 写入，不使用来源内容拼接 `innerHTML`。

### 自动测试与交互验收

- 用 `jsdom` 测试进度、筛选、字段显隐、错误保留和下一条导航；
- 测试外部链接具有 `noopener noreferrer`；
- 测试候选字符串不会作为 HTML 执行；
- 桌面和窄屏浏览器完成打开、标注、保存、重启恢复、修改和导出；
- 检查无文字截断、控件重排、遮挡或误触；
- 验证牛客标签页登录不会使本地模块获得任何页面访问能力。

### 退出条件

- 操作者无需编辑 JSON/CSV 即可完成全部流程；
- 关闭页面或服务后可从已保存位置恢复；
- 页面无牛客请求、iframe、浏览器扩展或剪贴板权限。

## 阶段 5：命令、忽略规则和操作文档

### 修改文件

```text
app/package.json
.gitignore
app/quality/nowcoder-intake/README.md
```

### 命令

在 `app/` 增加：

```text
npm run annotation:start
npm run test:annotation-tool
```

`annotation:start` 默认输出可点击的 `http://127.0.0.1:<port>`，支持 `port=<number>`，但不自动打开或控制浏览器。启动日志只显示端口、候选数量和本地数据路径，不打印标注内容。

README 增加：

- 如何启动、打开和停止模块；
- 如何在牛客自己的标签页登录；
- 每个字段的简短标注准则；
- 什么内容绝不能复制；
- 如何跳过和恢复；
- 如何导出并把汇总交给原创出题流程；
- 人工结果不能修改自动采集批准状态，也不能直接进入题库。

`.gitignore` 忽略 `manual-data/`，保留代码、Schema 和固定测试 fixture。

### 退出条件

- 新用户按 README 可在一分钟内打开模块；
- 本地标注和导出默认不会进入 Git；
- 命令不需要云服务、牛客凭据或额外安装。

## 阶段 6：最终验证与缺陷清理

### 自动验证

在 `app/` 运行：

```text
npm run test:annotation-tool
npm run test:intake
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

### 交互烟雾测试

1. 启动本地模块并记录 URL；
2. 桌面视口打开首条来源、填写并保存；
3. 关闭并重新启动，确认恢复；
4. 修改已完成记录并确认统计更新；
5. 标记一条跳过，确认不进入高频统计；
6. 在窄屏视口完成一次保存；
7. 导出四个文件并交叉核对计数；
8. 检查数据文件与导出中没有 Cookie、账号、正文、题干、选项或答案字段；
9. 检查服务监听地址、响应安全头和浏览器网络请求；
10. 删除测试用人工数据，避免把烟雾测试当作真实标注。

### 缺陷处理原则

- 新增失败必须修复后才能交付；
- 既有 warning 单独记录，不通过无关升级掩盖；
- 不使用 `npm audit fix --force`；
- 不因测试方便放宽隐私、来源、Host、Origin 或数据 Schema 门禁；
- 交互测试发现的遮挡、状态丢失、误计数和重复保存问题必须加入自动回归测试。

### 最终验收

- 59 条候选来源全部可见且顺序稳定；
- 保存、恢复、修改、跳过和导出均通过自动与交互测试；
- 本地服务只能从本机访问，没有牛客抓取或登录态读取能力；
- 输出只含批准的结构化字段和用户自己的短概括；
- 汇总统计可重复且与逐条标注一致；
- 正式 App、题库、CloudBase、analytics 和 Expo Go 行为无回归。

## 建议提交边界

1. `test: define manual signal annotation schema and validation`
2. `feat: add atomic annotation storage and deterministic exports`
3. `feat: add loopback-only annotation service`
4. `feat: add local manual annotation interface`
5. `docs: add annotation workflow and verification`

每个提交只包含该阶段文件和对应测试。人工标注数据与导出永不进入上述提交。
