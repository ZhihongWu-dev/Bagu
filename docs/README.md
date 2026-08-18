# Bagu 文档索引

本目录只把仍会约束当前产品和下一步工作的文档放在显眼位置。已经完成的阶段性设计归档到 `archive/specs`；已执行完毕的实施计划由 Git 历史保留，不再占用当前文档目录。

## 当前状态

- 客户端位于 `app/`，使用 Expo SDK 54、React Native 0.81 和 Expo Router。
- 产品采用本地优先模式，课程、学习进度和复习数据保存在设备上。
- 当前主要体验是低文字密度的学习路径、Transformer 深度课程和知识手册。
- 下一项待实施工作是中国大陆匿名体验分析；用户拒绝分析时仍可完整离线使用。

## 当前规格

- [匿名体验分析](superpowers/specs/2026-08-15-mainland-anonymous-product-analytics-design.md)：下一阶段待实施，定义 CloudBase、隐私同意、事件和分析后台。
- [学习路径优先体验](superpowers/specs/2026-08-10-learning-path-first-low-text-design.md)：当前主导航和低文字密度交互原则。
- [Transformer 课程深度](superpowers/specs/2026-08-11-transformer-unit-course-depth-design.md)：当前课程层级、练习和内容深度约束。
- [知识手册图标系统](superpowers/specs/2026-08-11-knowledge-manual-icon-system-design.md)：当前知识库视觉语言和图标规则。

## 历史资料

`archive/specs/` 保存已经实施或被后续设计取代的阶段性规格。它们用于解释历史决策，不应直接作为当前需求来源。需要查看已删除的实施计划时，使用 Git 历史。

新增功能应先更新或增加当前规格；完成且不再约束后续工作的文档应移入归档，避免当前目录再次积累历史材料。
