import type { TopicId } from './types';

const RULES: [TopicId, RegExp][] = [
  ['transformer-attention', /\btransformer\b|attention|注意力|q\s*[·kv]|self-attention/i],
  ['position-encoding', /位置编码|positional|rope|alibi/i],
  ['training-objectives', /训练目标|交叉熵|language modeling|pretrain|预训练/i],
  ['sft-lora-quantization', /\bsft\b|lora|qlora|微调|量化|quantization/i],
  ['alignment-rlhf-dpo-grpo', /rlhf|dpo|grpo|ppo|对齐|偏好优化|reward model/i],
  ['inference-serving-vllm', /vllm|推理服务|serving|continuous batching|吞吐|并发/i],
  ['kv-cache-performance', /kv\s*cache|显存|延迟|latency|prefill|decode/i],
  ['rag-retrieval-rerank', /\brag\b|embedding|rerank|召回|检索|retrieval/i],
  ['redis-vector-database', /redis|向量数据库|vector database|milvus|faiss/i],
  ['agent-tool-workflow', /\bagent\b|工具调用|tool calling|workflow|工作流|memory/i],
  ['evaluation-safety-observability', /评估|evaluation|安全|幻觉|可观测|监控|故障排查|指标/i],
];

export function classifyTopics(text: string): TopicId[] {
  return RULES.filter(([, pattern]) => pattern.test(text)).map(([id]) => id);
}
