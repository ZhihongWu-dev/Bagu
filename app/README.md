# Bagu App

Bagu 是一个面向大模型/NLP 校招算法岗的每日八股训练 App。当前 V0.1 使用 Expo、React Native、TypeScript 和 Expo Router。

## 当前功能

- 多邻国式纵向学习路径
- 三个 Transformer 知识节点
- 单选题与即时结构化反馈
- 关键词底部解释弹窗
- 课程完成、经验值和下一节点解锁
- 间隔复习队列
- Web `localStorage` 与 Android/iOS 文件持久化

## 本地运行

```bash
npm install
npm run web
```

也可以使用 Expo Go：

```bash
npm start
```

然后使用 Expo Go 扫描终端中的二维码。

## 验证命令

```bash
npx tsc --noEmit
npm run lint
npx expo export --platform web --output-dir dist
```

产品设计见仓库根目录的 `docs/superpowers/specs/2026-08-04-bagu-v01-design.md`。
