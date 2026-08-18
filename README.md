# Bagu

Bagu 是一个面向大模型算法工程师和大模型应用工程师校招准备的移动学习应用。它以短课程、渐进解锁、练习反馈、生命值与连续学习记录组织 Transformer、推理部署、RAG、Agent 和工程实践等内容。

项目目前处于活跃开发阶段，优先保证 iPhone 与 Expo Go 的本地体验。学习进度默认保存在设备上；CloudBase 分析与简历分析能力均为可选模块，未配置后端时不会阻塞核心学习流程。

## 目录结构

```text
app/                 Expo SDK 54 / React Native 客户端、内容与质量工具
cloudbase/           可选的分析和简历分析后端
docs/                当前规格、实施计划与历史设计归档
.github/workflows/   GitHub Actions 质量检查
```

## 本地运行

需要 Node.js 22、npm，以及手机上的 Expo Go。

```bash
cd app
npm ci
npm start
```

手机与电脑处于可互相访问的网络时，可用 Expo Go 扫描终端二维码。Web 调试可运行：

```bash
npm run web
```

无需创建 `.env` 即可使用离线学习功能。需要连接开发环境时，以 `app/.env.example` 为模板；该文件只包含公开 URL 和功能开关，任何服务端密钥都不得使用 `EXPO_PUBLIC_` 变量或进入客户端包。

## 验证

主要检查命令在 `app/` 中运行：

```bash
npx tsc --noEmit
npm run lint
npm run validate:content
npm run validate:questions
npm run test:question-quality
npm run test:learning
npm run test:roles
npm run test:application
npm run test:analytics
npm run test:annotations
npm run test:annotation-tool
npm run test:intake
npx expo-doctor
```

其他细分校验可查看 `app/package.json`。CI 不部署 CloudBase，也不需要生产凭据。

## 后端状态

`cloudbase/` 包含匿名产品分析、聚合后台和可选简历分析接口。它们是部署模板，不代表线上环境已经创建。启用前应分别阅读目录内的 README，完成鉴权、数据保留、用户同意和删除流程验证。

## 题目与外部资料

Bagu 可以利用公开技术报告、开源项目和公开面经总结考点分布，但正式题库内容应由项目重新组织和审核。仓库不收录从牛客等平台批量复制的受限题目正文，也不提交人工标注原文、登录状态、Cookie 或用户个人信息。

## 协作与 `push`

贡献通过功能分支和 Pull Request 进行。对协作 coding agent 而言，仓库所有者单独说 `push` 表示：检查当前任务范围和敏感信息、运行相关测试、仅提交确认过的文件、推送 `agent/<description>` 分支，并创建或更新面向 `main` 的 Draft PR。

`push` 不代表强制推送、跳过测试、自动合并或在混合工作区中盲目提交所有文件。

## 版权

除各文件或 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 另有说明外，Bagu 暂未采用开源许可证。公开可见不等于获得复制、再分发、修改或商业使用授权。保留所有依法享有的权利。

安全问题请按 [SECURITY.md](SECURITY.md) 处理。
