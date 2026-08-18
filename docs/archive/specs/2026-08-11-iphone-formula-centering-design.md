# Bagu iPhone 公式居中修复设计

## 问题与目标

iPhone Expo Go 中的离线 KaTeX 公式没有位于公式卡片的水平正中。公式内容本身和 LaTeX 数据正确，问题位于 `MathFormula` 的 WebView HTML 布局及 iOS 内容边距。本轮只修复公式布局，不改课程数据、字号体系、公式卡片外观或离线架构。

验收标准：

- 宽度小于公式框的公式在框内严格水平居中。
- 宽度超过公式框的公式保持原字号，不换行、不裁切，并可横向滑动。
- Native 和 Web 使用同一对齐语义；重点验收 iPhone Expo Go。
- 公式仍完全离线，不引入 CDN、网络请求或新的原生模块。

## 采用方案

采用 CSS-only 的“满宽居中轨道”方案。公式框内部拆成两个职责：

1. `#container` 是宽度为 100% 的横向滚动视口。
2. `.katex-display` 是公式轨道，使用 `width: max-content` 与 `min-width: 100%`。短公式的轨道至少铺满视口，并通过 Flex 居中；长公式的轨道按内容自然扩展，由外层视口负责滚动。

与缩小长公式相比，该方案保持可读字号；与 JavaScript 测量宽度后切换样式相比，它没有异步测量、重排闪动和 iPhone WebView 时序依赖。

## Native 实现

`MathFormula` 继续使用现有离线 `createKaTeXHTML` 和自动高度 WebView。生成 HTML 后在 `</head>` 前追加一段受组件控制的覆盖样式：

- `html`、`body`、`#outer-wrapper` 和 `#container` 使用完整可用宽度，并统一 `box-sizing: border-box`。
- `#container` 设置 `overflow-x: auto`、`overflow-y: hidden` 和 iOS 惯性滚动。
- `.katex-display` 设置 `display: flex`、`justify-content: center`、`align-items: center`、`width: max-content`、`min-width: 100%`。
- `.katex-display > .katex` 保持单行、不可压缩，避免 KaTeX 内部规则重新改成左对齐或换行。
- WebView 显式关闭自动内容边距，确保 iOS 不额外加入安全区或滚动视图 inset。

现有透明背景、自动高度、外部导航拦截和离线资源策略保持不变。若未来上游 HTML 模板改变，样式注入函数找不到 `</head>` 时应在开发阶段失败，而不是静默退化。

## Web 一致性

Web 端公式 DOM 使用相同的“滚动视口 + 满宽居中轨道”结构：视口宽度 100% 且允许横向滚动；内部节点为 `width: max-content`、`min-width: 100%`、Flex 居中。这样浏览器预览与 iPhone 的短公式位置一致，长公式行为也一致。

## 自动化验证

- 为 Native 生成的 HTML 增加结构校验，确认居中轨道、横向滚动和禁止换行规则存在。
- 静态校验 iOS WebView 已关闭自动内容边距。
- 保留 62 条公式严格 KaTeX 编译及全部结构化公式使用检查。
- 运行内容、公式、UI、TypeScript、ESLint、Expo Doctor、Web 导出和 iOS 导出。
- 启动新的 Expo LAN 服务，验证 SDK 54 manifest 与 iOS bundle 返回成功，并生成新的 Expo Go 二维码。

## 自审结论

规范没有修改公式语义、数据 ID、课程进度或答题逻辑。短公式居中与长公式滚动由同一 CSS 约束自然区分，不依赖设备宽度常量。Native 与 Web 的实现范围清晰，离线与安全边界保持不变；没有 TBD、TODO 或未确定参数。
