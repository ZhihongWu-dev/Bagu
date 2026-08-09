# 五 Tab 移动导航与触摸修复实施计划

## 路由

- 将首页、今日、知识库、复习和我的迁移到 `(tabs)` 路由组。
- 使用 Expo Router `Tabs` 替代每页手工挂载的 BottomNav。
- 新增独立学习路径页，课程、完成、知识详情、简历和模拟面试保留在根 Stack。

## 触摸修复

- 根布局只保留 Progress Provider、StatusBar 和 Stack。
- 音频加载从根 Provider 下沉到答题页和完成页。
- 关闭 SDK 54 下的 React Compiler 实验项。
- 手机端 ScreenShell 直接渲染单层根 View。
- 关键词 Modal 仅在打开时挂载。

## 信息架构

- 首页只保留概览、今日入口、两个学习模块和模拟面试。
- 今日页只保留三个任务，不展示完整课程路径。
- 完整 Transformer 路径独立为二级页面。

## 验证

- 运行 TypeScript、ESLint、Expo Doctor、Web 导出和 iOS 导出。
- 审查全屏绝对定位、Modal 和导航调用。
- 验证全部公开路由返回 200，首屏包含可交互 Pressable 标记。
- 重启 SDK 54 tunnel 并生成新的 Expo Go 二维码。
