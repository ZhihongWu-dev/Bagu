# iPhone Expo Go 与核心音效实施计划

## 1. SDK 兼容迁移

- 将 Expo 主版本切换到 SDK 54。
- 删除未使用的 `@expo/ui`、`expo-glass-effect`、`expo-symbols`、`expo-device`、`expo-image` 和 `expo-web-browser`。
- 使用 Expo 依赖修复命令统一 React、React Native、Expo Router 和全部原生模块版本。
- 安装 SDK 54 对应的 `expo-audio`。

## 2. 音频资产与播放层

- 添加确定性 WAV 生成脚本，产生答对、答错和完成三个原创短音效。
- 添加全局 Sound Provider，集中加载和安全重播三个音频。
- 音频错误只在开发环境记录，永不阻塞学习流程。

## 3. 产品接入

- 在答案提交时播放答对或答错音效。
- 在课程完成页首次进入时播放完成音效。
- 在本地进度中新增向后兼容的 `soundEnabled` 字段。
- 在“我的”页面添加音效开关和三个反馈类型说明。

## 4. 验证与交付

- 运行 Expo Doctor、TypeScript 和 ESLint。
- 导出 Web 静态版本和 iOS bundle。
- 启动 tunnel，确认 manifest 的 SDK 版本并生成 Expo Go 二维码。
- 提交实现代码，保留用户现有临时文件不变。
