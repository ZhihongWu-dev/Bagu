export function classifyRole(text: string): 'llm_algorithm' | 'llm_application' | 'shared' | 'unknown' {
  const algorithm = /算法工程师|多模态|训练|微调|对齐|rlhf|dpo|grpo|预训练/i.test(text);
  const application = /应用工程师|rag|agent|部署|服务|redis|向量数据库|工具调用/i.test(text);
  return algorithm && application ? 'shared' : algorithm ? 'llm_algorithm' : application ? 'llm_application' : 'unknown';
}

export function classifyRecruiting(text: string): 'campus-autumn' | 'campus-other' | 'unknown' {
  if (/秋招|秋季校园招聘/i.test(text)) return 'campus-autumn';
  if (/校招|应届|春招|校园招聘/i.test(text)) return 'campus-other';
  return 'unknown';
}
