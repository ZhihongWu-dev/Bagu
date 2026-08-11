# Bagu 首页简化与离线公式渲染设计

## 目标

本轮只解决三个已确认问题：隐藏首页重复的 Unit 总卡片；暂时不展示现有学习伙伴；把所有结构化公式从普通文本升级为经过 KaTeX 排版的离线数学公式。课程结构、学习进度、题目数量和知识 ID 保持不变。

## 首页调整

- 首页不再渲染 `Unit 1 · Transformer` 总卡片。
- 状态栏下直接进入第一个 Section，保留 Section 标题、完成进度和学习节点。
- `CourseUnit` 数据仍然保留，因为课程校验、节点集合和未来多 Unit 导航仍依赖它。
- 学习伙伴图片保留在资源目录，但 `LessonNode` 不再引用或显示它；后续更换角色时不需要恢复旧视觉。

## 方案选择

采用离线 KaTeX 方案：

- iOS/Android 使用 Expo Go 已内置原生支持的 `react-native-webview`，由离线 KaTeX 自动高度组件生成公式 HTML。
- Web 使用平台专属组件直接调用 KaTeX 并渲染 HTML。
- KaTeX JavaScript、样式和字体都随应用打包，不访问 CDN。
- 不采用 Unicode 上下标模拟数学排版，也不为每条公式预生成静态图片。

该方案兼顾当前 Expo Go、Web 预览和未来动态生成公式。WebView 只承载独立公式，不承载页面导航和业务状态。

## 数据模型

新增 `MathExpression`：

```ts
type MathExpression = {
  latex: string;
  plainText: string;
};
```

- `latex` 是唯一的排版输入，必须通过 KaTeX 严格解析。
- `plainText` 只用于无障碍朗读、日志、搜索和异常诊断，正常界面不得直接显示它。
- `KnowledgeKeyword.formula`、`ExerciseBase.formula`、`KnowledgeCard.formula` 和 Transformer 节点蓝图全部改用该类型。
- `Choice` 增加可选 `formula`。当选项本身是一条公式时，按钮渲染公式组件；`label` 仍保存可搜索和可朗读文本。

## 组件边界

### `MathFormula`

- 输入：`MathExpression`、显示模式、颜色、字号和容器样式。
- 输出：居中、可访问、自动高度的公式。
- 长公式允许横向滚动，不通过缩小字号强行塞入屏幕。
- 禁止 WebView 自身滚动、缩放、链接跳转和任意外部请求。

### Native 实现

- 使用自动高度 WebView 加载本地生成的 KaTeX HTML。
- HTML 设置透明背景、禁用选择和页面滚动，仅返回内容高度。
- 公式资源完全内嵌，飞行模式下仍可渲染。

### Web 实现

- 使用 `katex.renderToString` 生成 HTML。
- 启用 `throwOnError`，并加载本地 KaTeX CSS 和字体。
- 视觉样式与 Native 共用尺寸和颜色契约。

## 公式迁移

- 所有现有 `formula` 字段转换为规范 LaTeX，使用 `\frac`、`\sqrt`、上下标、矩阵维度、期望、范数和算子命令表达语义。
- 函数名使用 `\operatorname{}` 或 KaTeX 内置算子，避免变量斜体误用。
- 英文解释性关系改为数学符号或 `\text{}`，不把自然语言伪装成变量连乘。
- 相同公式复用同一个表达式常量，避免知识页和题目页出现不一致版本。
- 本轮覆盖知识详情公式卡、课程题目公式、公式型选择项和关键词弹窗；普通说明文字中的短变量名仍作为正文，完整等式不得混入正文。

## 错误处理

- 开发和内容校验阶段，任何 KaTeX 解析错误都直接失败并报告公式来源 ID。
- 运行时若出现不可预期错误，展示统一的“公式暂时无法显示”状态并记录 `plainText`，不把原始 LaTeX 或 Unicode 公式直接暴露给用户。
- Native WebView 拒绝外部 URL 和脚本导航，避免公式内容扩大权限边界。

## 自动化验证

- 内容验证遍历所有知识、题目、关键词和公式型选项，确保 `latex`、`plainText` 非空。
- 使用 KaTeX 严格模式编译全部公式；任意解析失败即退出非零状态。
- 静态检查知识页、课程页和关键词弹窗不得以 `<Text>` 直接输出 `.formula`。
- 保留原有 5 Sections、25 节点、300 题和知识引用完整性检查。
- 运行 TypeScript、ESLint、Expo Doctor、Web 导出和 iOS 导出。
- 以手机比例检查首页、知识公式、课程公式、长公式滚动和公式型选项，并用新端口生成 Expo Go 二维码。

## 自审结论

规范没有改变课程 ID、进度或复习队列。公式数据、渲染器和校验器边界清晰；离线要求明确；Native 与 Web 的实现差异被限制在平台文件内。范围不包含重新设计主人公、增加新课程或解析正文中的所有自然语言变量，避免本轮扩散。
