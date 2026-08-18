# Role Goals and Interview-Driven Curriculum Design

## Goal

Bagu will support two primary learning goals:

- Large Language Model Algorithm Engineer (`llm_algorithm`)
- Large Language Model Application Engineer (`llm_application`)

Every user selects exactly one current goal before entering the learning experience. Users can later switch courses from the Profile tab without losing progress, similar to switching the active language in a language-learning product.

The curriculum will use recent public interview reports to identify recurring questions and follow-up patterns. Answers remain original Bagu content and must be verified against primary technical sources.

## Scope

The first complete release contains:

- The existing 25-node Transformer unit as shared curriculum
- 25 algorithm-engineer specialist nodes
- 25 application-engineer specialist nodes
- 12 exercises per new node, for 600 new exercises
- At least one knowledge article for every specialist node
- Concept, trade-off, oral explanation, project scenario, and troubleshooting exercises
- No code editor and no hand-written coding exercises

The resulting catalog contains 75 learning nodes and 900 exercises before adaptive session selection.

## First-Run Goal Selection

After local progress hydration, users without a `targetRole` are routed to a dedicated goal-selection screen before any tab or lesson route is available.

The screen presents two full-width choices with an icon, role name, and a short description:

- Algorithm Engineer: model training, alignment, architecture, and inference optimization
- Application Engineer: RAG, agents, evaluation, deployment, and production troubleshooting

There is no skip action. Selecting a role writes it to local progress and opens the learning path. Existing users retain completed lessons, XP, streak, hearts-related progress, review items, favorites, resume data, and project data.

Deep links to tabs, lessons, or completion screens cannot bypass this selection.

## Switching Courses

The Profile tab contains a `Current target role` row. Selecting it opens a compact role menu with both roles. Switching takes effect immediately and does not require destructive confirmation because no data is removed.

The Learning tab does not contain a role switcher. It remains focused on the current path.

## Progress Model

Shared nodes use their existing stable IDs and one shared completion record. Completing a shared lesson in either role makes it complete in both roles.

Specialist node IDs use role prefixes:

- `alg-*` for algorithm-engineer nodes
- `app-*` for application-engineer nodes

Specialist progress remains stored when the user switches roles. The current learning path is the shared unit followed by the selected specialist unit. Strict sequential unlocking applies across the combined path.

Completed historical nodes remain replayable. An unfinished node is unlocked only when every earlier node in the current combined path is complete.

The review queue is global. Items added under a previous role remain scheduled and visible after switching.

## Algorithm Engineer Curriculum

### Section 1: Pretraining Data and Objectives

1. Data mixture and domain weighting
2. Cleaning, quality filtering, and deduplication
3. Tokenizer vocabulary and multilingual trade-offs
4. Causal pretraining objectives and loss masking
5. Scaling laws, checkpoints, and capability evaluation

### Section 2: Supervised Fine-Tuning and PEFT

1. SFT data format and conversation templates
2. Base model versus chat model selection
3. LoRA, QLoRA, rank, alpha, and target modules
4. Full fine-tuning versus parameter-efficient tuning
5. Catastrophic forgetting and regression evaluation

### Section 3: Preference Alignment and Reasoning RL

1. Preference data and reward-model training
2. PPO-based RLHF and its four-model workflow
3. DPO objective, reference policy, and practical limits
4. GRPO and verifiable-reward reasoning training
5. Reward hacking, KL control, and alignment evaluation

### Section 4: Modern Model Architecture Reports

1. Qwen architecture and training evolution
2. DeepSeek-V2/V3, MLA, and mixture-of-experts design
3. DeepSeek-R1 reasoning pipeline and distillation
4. MoE routing, auxiliary loss, capacity, and load balance
5. Long-context training, RoPE scaling, and context quality

### Section 5: Training Systems and Inference Engineering

1. Data, tensor, pipeline, and expert parallelism
2. ZeRO, optimizer states, and memory estimation
3. Mixed precision, loss scaling, and training instability
4. PTQ/QAT, GPTQ/AWQ, and accuracy trade-offs
5. Training and serving bottleneck diagnosis

## Application Engineer Curriculum

### Section 1: RAG Foundations

1. Document parsing, chunking, and metadata
2. Embedding selection and similarity behavior
3. Vector indexes, recall, and latency trade-offs
4. Rerankers and candidate-stage design
5. End-to-end RAG pipeline design

### Section 2: Advanced Retrieval and Faithfulness

1. Hybrid sparse and dense retrieval
2. Query rewriting, decomposition, and routing
3. Graph RAG and structured knowledge retrieval
4. Citations, evidence grounding, and refusal
5. Retrieval and generation evaluation

### Section 3: Workflows, Agents, and Tools

1. Workflow versus agent boundaries
2. Function calling and tool schema design
3. Short-term, long-term, and external memory
4. Planning, reflection, retries, and stop conditions
5. MCP, multi-agent coordination, and failure boundaries

### Section 4: Evaluation, Safety, and Observability

1. Golden datasets and task-specific metrics
2. LLM-as-a-judge bias and calibration
3. Hallucination detection and guardrails
4. Prompt injection, data leakage, and tool security
5. Tracing, feedback, drift, and online monitoring

### Section 5: Deployment and Project Diagnosis

1. Model APIs, streaming, caching, and fallbacks
2. Concurrency, continuous batching, and backpressure
3. Token cost, latency budgets, and model routing
4. Production incident diagnosis and degradation strategies
5. Project review: problem, evidence, trade-off, result, and lesson

## Exercise Composition

Every specialist node has 12 source exercises:

- 4 core concept questions
- 3 comparison or boundary questions
- 3 business scenario, project follow-up, or troubleshooting questions
- 2 oral deep-dive questions with structured answer points

Adaptive practice continues to select 8, 10, or 12 questions based on recent performance. Questions must contain concrete facts and topic-specific distractors; generic template-only questions are not acceptable.

## Knowledge Library Behavior

The library prioritizes the current role's specialist topics while retaining search access to the complete catalog. Shared concepts appear for both roles. Switching roles changes default ordering, not access or favorites.

Each new article includes:

- A direct interview answer
- Intuition and technical explanation
- Important equations when relevant
- Practical boundaries and failure modes
- Common misconceptions
- Likely follow-up questions
- Primary sources

## Research and Source Policy

### Interview evidence

The primary discovery pool is recent public interview experience from GitHub and Nowcoder:

- Prefer 2024-2026 mainland-China interview reports for LLM algorithm and application roles.
- Record the target role, company or team direction when public, interview round, core question, and follow-up category.
- Use `km1994/LLMs_interview_notes` as an Apache-2.0 topic index, while still rewriting all Bagu material independently.
- Use `wdndev/llm_interview_note` only for topic discovery because it does not declare a reusable content license.
- Use CC BY-SA repositories such as `MisterBooo/llm-interview-questions` only to discover topics and review verification methodology; do not copy their text, diagrams, or content structure into Bagu.

Nowcoder posts and other public interview reports are discovery evidence only. They may identify repeated topics, question depth, and project follow-up patterns, but their text, answers, and claimed frequency counts are not copied or treated as authoritative.

A topic enters the high-frequency core path only when at least one condition is met:

1. It appears in at least three independent public interview sources.
2. A recent role-specific interview report contains a substantial multi-step follow-up on it and primary technical sources confirm its relevance.

Do not publish precise occurrence counts unless every counted source is recorded and independently auditable. Each accepted topic keeps internal evidence metadata: source URL, retrieval date, role, interview stage when available, and normalized topic tags.

### Technical verification

Technical claims must be checked against primary sources such as:

- Qwen and DeepSeek official technical reports
- Original papers for Transformer, PPO, DPO, GRPO, MoE, RAG, and related methods
- Official repositories and documentation for vLLM, DeepSpeed, Megatron-LM, PyTorch, Hugging Face, and MCP

External text, diagrams, and code are not copied. Repositories with restrictive or share-alike licenses may inform topic discovery but are not used as content templates. Every Bagu answer is independently written and source-linked.

### Content review

For each specialist node, the implementation must separate three inputs:

- Interview evidence determines what is asked and how deeply interviewers follow up.
- Primary technical sources determine the factual answer and implementation boundaries.
- Bagu's editorial pass produces the original Chinese explanation, distractors, project scenario, and oral-answer rubric.

No node passes content validation without both interview evidence and at least one primary technical source.

## Storage and Privacy

`targetRole` is added to the versioned local progress schema. Missing or invalid values normalize to `null`, which triggers onboarding. Switching roles updates only this field.

The selected career goal remains local in this release. It is not added to anonymous analytics events or uploaded to CloudBase.

## Architecture

- A role catalog defines stable role IDs and display metadata.
- A course catalog composes shared units with the selected specialist unit.
- Progress context owns the hydrated `targetRole`, selection action, and current combined lesson order.
- The root navigation guard enforces role selection.
- The Profile tab owns course switching.
- Learning, lesson, and completion screens use the same combined-path access rule.
- Knowledge filtering derives from the current role without modifying stored favorites.

## Verification

Automated tests cover:

- New-user goal selection
- Existing-progress migration with no role
- Invalid stored role normalization
- Profile course switching
- Shared progress synchronization
- Specialist progress isolation and preservation
- Strict unlocking across shared and specialist boundaries
- Deep-link onboarding and lesson guards
- Review queue and favorites across role switches
- Exact node, exercise, and knowledge-source counts
- Interview-evidence metadata and primary-source presence for every specialist node

The implementation must also pass TypeScript, lint, content validation, formula validation, UI icon validation, Expo Doctor, and iOS/Android/Web export smoke tests. A mobile-sized interactive smoke test verifies onboarding, both paths, switching, locked nodes, and retained progress.

## Acceptance Criteria

1. A user without a valid role cannot enter the main application.
2. Selecting either role opens the correct combined learning path.
3. Users can switch only from Profile, with no progress loss.
4. Shared completion appears in both roles; specialist completion remains attached to its role.
5. The app contains 25 specialist nodes and 300 specialist exercises per role.
6. No exercise requires writing code.
7. Every specialist node has a sourced knowledge article and project-oriented practice.
8. Role selection remains local and absent from analytics payloads.
9. Every specialist node meets the interview-evidence threshold and records at least one primary technical source.
