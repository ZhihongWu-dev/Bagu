# Bagu App

Bagu 是一个面向大模型/NLP 校招算法岗的每日八股训练 App。当前 V0.1 使用 Expo SDK 54、React Native、TypeScript 和 Expo Router，可由 iPhone App Store 版 Expo Go 直接打开。

## 当前功能

- 通用八股与简历项目深挖双入口，未上传简历不阻塞学习
- 6 个算法方向、17 张结构化知识卡，支持搜索、领域筛选和收藏
- 30 秒主动回忆、面试参考回答、直觉解释、追问和原始资料链接
- 多邻国式 Transformer 闯关路径、即时反馈、经验值和节点解锁
- 课程、通用知识和项目追问统一复习队列
- PDF 文件选择与手动项目档案；第一版不上传或解析简历正文
- 通用、简历与综合三种模拟面试模式
- 答对、答错与课程完成三个原创本地音效，可在“我的”中关闭
- Web `localStorage` 与 Android/iOS 文件持久化

## 本地运行

```bash
npm install
npm run web
```

使用 iPhone Expo Go：

```bash
npm start
```

确保电脑与 iPhone 可以访问互联网，然后使用 App Store 中的 Expo Go 扫描终端二维码。本项目固定使用 SDK 54，以兼容当前 iPhone App Store 版 Expo Go。

重新生成原创音效：

```bash
npm run generate-sounds
```

## 验证命令

```bash
npx tsc --noEmit
npm run lint
npx expo-doctor
npx expo export --platform web --output-dir dist
npx expo export --platform ios --output-dir dist-ios
```

公共知识与双模块设计见仓库根目录的 `docs/superpowers/specs/2026-08-09-bagu-public-knowledge-agent-design.md`。
