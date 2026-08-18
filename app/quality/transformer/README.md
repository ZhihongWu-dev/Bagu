# Transformer 题库质量审计

这里保存开发期审计材料，不由 App 运行时代码导入。

## 发布边界

- `baseline.json` 和 `id-migration.json` 锁定迁移前的 25 个节点与 300 个练习 ID。
- `schemas/question-review.schema.json` 定义双角色审题输出。
- `prompts/` 分离证据审查与命题质量审查；两者都不能读取命题者的隐藏推理。
- `gold/gold-set.json` 当前明确标记为 `uncalibrated`。Transformer 技术事实未经领域人员确认前，Agent 结论只能用于提出修改建议，不能批准发布。
- `reviews/` 中的审题记录必须通过 `npm run validate:question-reviews`。

## 本地命令

```bash
npm run validate:questions
npm run test:question-quality
npm run validate:question-reviews
```

六项硬门槛不可互相补偿。全部通过后，四项锚定评分还需达到总分 13/16 且单项不低于 2。未校准审题记录不能使用 `pass`。

确定性门禁还检查题型分布：同一 v2 Section 的多选题至少出现两种正确项基数，任一基数占比不超过 75%；排序题的展示顺序不得等于正确顺序；至少 12 道单选时，任一正确位置占比不超过 40%。这些阈值用于拦截模板提示，不替代人工判断题目本身是否有效。
