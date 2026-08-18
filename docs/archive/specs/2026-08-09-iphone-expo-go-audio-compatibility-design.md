# Bagu iPhone Expo Go 与核心音效兼容设计

## 背景与目标

Bagu 当前使用 Expo SDK 57，而 iPhone App Store 中可直接安装的 Expo Go 仍以 SDK 54 为兼容版本。此次改造的首要目标是让用户无需 TestFlight、Mac 或自定义 development build，只需在 iPhone 安装 Expo Go，即可扫描开发服务器二维码打开应用。

第二个目标是在答题闭环中加入三个低干扰的核心音效：答对、答错和课程完成。音效仅提供即时反馈，不改变课程状态、计分或导航逻辑。

## 技术方案

采用单分支 Expo SDK 54 方案，不保留并行的 SDK 57 运行分支。Expo、React、React Native、Expo Router、Document Picker、File System、Reanimated 等依赖全部调整为 SDK 54 推荐版本。删除源码未使用且可能增加版本约束的 SDK 57 专属依赖。

音频使用 SDK 54 内置于 Expo Go 的 `expo-audio`。三个声音使用仓库内的原创短 WAV 文件，不依赖网络，也不使用来源或授权不清晰的第三方音效。全局 Sound Provider 负责预加载和播放，页面只调用语义方法：`playCorrect`、`playWrong`、`playComplete`。

## 音效行为

- 用户提交答案时，按当前选择播放答对或答错音效，每次提交只播放一次。
- 进入课程完成页时播放完成音效，每次完成流程只播放一次。
- 音效遵循 iPhone 系统静音状态，不强制绕过静音开关。
- “我的”页面提供音效总开关，默认开启，选择保存到现有本地进度文件或 Web localStorage。
- 播放器未加载、系统拒绝播放或 Web 自动播放受限时，静默跳过音效；答题、计分、解锁和导航必须继续正常工作。
- 快速重复触发同一个音效时先回到开头再播放，避免第二次点击没有声音。

## 数据与组件边界

本地进度结构新增可选字段 `soundEnabled`。读取旧版本进度时，字段缺失按开启处理，保证已有用户数据无需迁移脚本。

Sound Provider 只依赖 `soundEnabled`，不负责修改学习数据。学习页和完成页不直接创建底层音频对象，因此后续替换声音、增加震动或调整音量时，不需要修改业务流程。

## 兼容性范围

- 主要目标：物理 iPhone、App Store 版 Expo Go、Expo SDK 54。
- 最低 iOS 版本遵循 SDK 54 的官方要求，即 iOS 15.1。
- 保留现有 Expo Web 功能，音效在浏览器允许播放时工作。
- Android 继续保持代码兼容，但此次不以 Android 真机作为阻塞验收项。
- 第一版不实现后台播放、录音、音乐混音或自定义音量滑块。

## 实施与错误处理

迁移时先调整 Expo 主版本，再使用 Expo 的依赖修复命令对齐所有原生包，随后处理 SDK 54 API 差异。若某个当前功能依赖 SDK 57 才存在的 API，优先用 SDK 54 等价 API替换，不删除用户可见功能。

音频资源由确定性生成脚本产生并提交到 `assets/sounds`，确保三个声音可复现。播放器错误仅在开发环境记录，不向普通用户弹出阻塞提示。

## 验收标准

1. `npx expo-doctor` 不报告 SDK 依赖版本不匹配。
2. TypeScript、ESLint 与 Expo Web 静态导出通过。
3. iOS Metro bundle 可成功生成，项目 manifest 标识为 SDK 54。
4. iPhone App Store 版 Expo Go 可以扫描二维码进入首页，不再提示需要更新 Expo Go。
5. 答对、答错和课程完成分别播放不同的短音效。
6. 关闭音效后三个触发点均不播放，重启应用后开关状态保持。
7. 音频故障不会影响答题、XP、复习安排或页面跳转。

## 非目标与后续

此次不生成可上架 IPA，也不配置 TestFlight。产品进入多人测试或准备发布时，应从 Expo Go 迁移到 development build 和正式 EAS Build；该迁移不会改变本次定义的 Sound Provider 接口。
