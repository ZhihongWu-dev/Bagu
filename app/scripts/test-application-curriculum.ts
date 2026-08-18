import { applicationKnowledgeCards, applicationNodes, applicationUnit } from '../src/data/application/curriculum';
import { buildAdaptivePracticeSession } from '../src/utils/practice-session';

const failures: string[] = [];
const check = (condition: unknown, message: string) => { if (!condition) failures.push(message); };

check(applicationUnit.sections.length === 8, 'Application path must contain eight sections.');
check(applicationNodes.length === 64, 'Application path must contain 64 nodes.');
check(applicationNodes.flatMap((node) => node.exercises).length === 1536, 'Application bank must contain 1,536 exercises.');
check(applicationKnowledgeCards.length >= 112, 'Application library must contain at least 112 articles.');

const legacyIds = ['app-parsing-chunking', 'app-embedding', 'app-vector-index', 'app-reranking', 'app-rag-pipeline', 'app-hybrid-search', 'app-query-routing', 'app-graph-rag', 'app-grounding', 'app-rag-evaluation', 'app-workflow-agent', 'app-tool-schema', 'app-memory', 'app-agent-control', 'app-mcp-multiagent', 'app-golden-set', 'app-llm-judge', 'app-hallucination-guardrail', 'app-prompt-security', 'app-observability', 'app-api-resilience', 'app-concurrency', 'app-cost-routing', 'app-incident', 'app-project-review'];
legacyIds.forEach((id) => check(applicationNodes.some((node) => node.id === id), `Legacy node ${id} must retain its id.`));

const searchable = applicationKnowledgeCards.map((card) => `${card.title} ${card.summary} ${card.answer}`).join(' ').toLowerCase();
['redis', 'vllm', 'milvus', 'faiss', 'elasticsearch', 'langchain', 'langgraph', 'fastapi', 'docker', 'kubernetes', 'nginx', 'opentelemetry', 'langfuse', 'ragas', 'qwen', 'deepseek', 'mcp'].forEach((term) => check(searchable.includes(term), `Knowledge library must cover ${term}.`));

applicationNodes.forEach((node) => {
  const seen = new Set<string>();
  for (let attempt = 0; attempt < 6; attempt += 1) buildAdaptivePracticeSession(node, attempt).forEach((item) => seen.add(item.exercise.id));
  check(seen.size >= 20, `${node.id} should expose at least 20 distinct exercises across six attempts.`);
});

if (failures.length) {
  console.error(`Application curriculum tests failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('Application curriculum tests passed: scale, migration ids, technology coverage, and practice rotation.');
