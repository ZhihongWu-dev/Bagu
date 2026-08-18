# Application Curriculum Expansion and Resume Analysis Design

## Goal

Bagu will expand the Large Language Model Application Engineer curriculum from an introductory 25-node path into a broad autumn-recruitment curriculum for candidates who have built a RAG or Agent demo, completed a relevant internship, or expect detailed project and engineering follow-up questions.

The release has two complementary capabilities:

- A complete public curriculum with substantially broader coverage, a larger reviewed question bank, and a richer knowledge library.
- Optional resume analysis that prioritizes relevant public content and adds project-specific follow-up questions.

Resume analysis does not replace the public curriculum, and the curriculum is not organized around fixed fictional projects.

## Audience and Boundaries

The primary audience is mainland-China campus recruitment and autumn recruitment candidates targeting Large Language Model Application Engineer roles.

The expected learner has at least one simple RAG or Agent demo, a course project, a competition project, or relevant internship exposure. The material must also remain usable by learners whose implementation experience is incomplete.

This release does not include:

- Handwritten coding exercises or an in-app code editor
- Traditional backend interview question banks unrelated to LLM applications
- Mandatory login
- Cross-device resume synchronization
- Permanent cloud storage of resumes
- Unreviewed model-generated public questions or answers

## Curriculum Scale

The application-engineer path contains exactly:

- 8 Sections
- 64 learning nodes
- 24 reviewed source exercises per node
- 1,536 application-engineer source exercises
- At least 112 application-engineer knowledge articles

Adaptive practice continues to present 8, 10, or 12 exercises per attempt. The larger source bank reduces repetition across attempts without increasing the length of every lesson.

The existing 25-node shared Transformer unit and the algorithm-engineer specialist path remain unchanged by this expansion.

## Application Curriculum

Each Section contains eight nodes.

### Section 1: Model and Context Engineering

1. Model capability and provider selection
2. Prompt instruction hierarchy and boundaries
3. Structured output and schema validation
4. Context-window and token-budget management
5. Multi-turn state and conversation compression
6. Streaming responses and interruption handling
7. Model API errors, timeouts, and retries
8. Capability limits, refusal, and fallback behavior

### Section 2: RAG Data Engineering

1. PDF, HTML, and office-document parsing
2. OCR and scanned-document quality
3. Tables, images, and layout-aware extraction
4. Semantic chunking and overlap
5. Parent-child and hierarchical chunks
6. Metadata design and filtering
7. Document permissions and tenant isolation
8. Incremental indexing, updates, and deletion

### Section 3: Retrieval and Ranking

1. Embedding-model selection
2. Cosine similarity, dot product, and normalization
3. BM25 and lexical retrieval
4. Dense and sparse hybrid retrieval
5. HNSW, IVF, recall, and latency
6. Query rewriting, decomposition, and routing
7. Multi-route recall and rank fusion
8. Cross-encoder reranking and candidate budgets

### Section 4: Generation and Evaluation

1. Context assembly and conflict handling
2. Citations and evidence attribution
3. Evidence insufficiency and refusal
4. Retrieval metrics and labeled relevance
5. Answer correctness and faithfulness
6. Golden-set design and versioning
7. LLM-as-a-judge bias and calibration
8. Ablation experiments and error attribution

### Section 5: Workflows and Tool Calling

1. Workflow and Agent boundaries
2. Function Calling lifecycle
3. Tool schema and argument validation
4. State machines and checkpointing
5. Parallel and dependent tool execution
6. Idempotency, retries, and compensation
7. Human confirmation and sensitive actions
8. MCP architecture, trust, and capability boundaries

### Section 6: Agents and Memory

1. Planning strategies and plan updates
2. Reflection and useful retry conditions
3. Stop conditions, budgets, and loop prevention
4. Short-term working memory
5. Long-term and external memory
6. Context compression and information loss
7. Multi-Agent coordination and responsibility boundaries
8. Partial failure and recovery

### Section 7: Safety and Observability

1. Direct prompt injection
2. Indirect prompt injection through retrieved content
3. Data leakage and sensitive-data handling
4. Least-privilege tool access
5. Output validation and content safety
6. Distributed tracing across retrieval, model, and tools
7. User feedback, bad-case collection, and regression
8. Drift detection and adversarial evaluation

### Section 8: Production Engineering

1. Exact and semantic caching
2. Concurrency, queues, and backpressure
3. Continuous batching and latency trade-offs
4. Model routing and fallback
5. Token cost and latency budgets
6. Capacity planning and autoscaling
7. Circuit breaking and graceful degradation
8. Evidence-based technical review and incident analysis

## Technology Coverage

The curriculum must cover stable principles and concrete implementation tools without becoming an API memorization guide.

Required technology topics include:

- Redis: exact and semantic caching, session state, rate limits, idempotency, locks, invalidation, and stale results
- vLLM: PagedAttention, continuous batching, prefill and decode, KV cache, parallelism, quantization, metrics, and OpenAI-compatible serving
- Milvus, FAISS, and Elasticsearch: indexing, metadata filters, hybrid retrieval, updates, and operational trade-offs
- LangChain and LangGraph: state, nodes, checkpointing, retries, human-in-the-loop execution, and framework boundaries
- MCP: capability discovery, tools, resources, prompts, authorization, and trust boundaries
- FastAPI, SSE, and WebSocket: asynchronous model APIs, streaming, cancellation, timeouts, and connection failures
- Docker, Kubernetes, and Nginx: packaging, health checks, scaling, routing, and deployment failure boundaries
- OpenTelemetry and Langfuse-style observability: traces, spans, tokens, latency, retrieval events, tool calls, and redaction
- BM25, HNSW, RRF, cross-encoders, RAG evaluation, golden datasets, and calibrated model judges
- Qwen, DeepSeek, and other commonly encountered mainland model ecosystems, with claims limited to verified version-specific capabilities

Tools appear in dedicated implementation articles and in exercises. Core learning nodes continue to teach concepts that remain useful when a particular framework changes.

## Exercise Design

Every application node contains 24 authored source exercises:

- 6 core concept exercises
- 4 mechanism and boundary exercises
- 4 technology selection and comparison exercises
- 4 troubleshooting exercises
- 3 metrics and experiment-analysis exercises
- 3 oral follow-up exercises

No exercise requires writing code. Interface definitions, schemas, traces, configuration excerpts, metrics, architecture descriptions, and log fragments may be shown when they are necessary for engineering judgment.

Every exercise stores:

- Stable exercise ID
- Node ID and topic tags
- Exercise category and difficulty
- Complete prompt and authored choices or oral rubric
- Correct answer and explanation
- Concrete reason for every distractor
- Follow-up chain when applicable
- Primary technical sources
- Interview-discovery evidence metadata

Runtime code selects exercises but does not construct generic question text from topic names. Duplicate or near-duplicate prompts are rejected by content validation.

## Knowledge Library

The application knowledge library contains at least 112 articles:

- 64 core node articles
- At least 48 tool, comparison, operational, and failure-mode articles

Each article includes:

- Direct interview answer
- Mechanism and intuition
- Boundaries and failure conditions
- Technology comparisons where relevant
- Operational metrics and diagnostic signals
- Common misconceptions
- Structured follow-up questions
- Versioned primary sources

The current target role continues to determine default ordering. All articles remain searchable and accessible regardless of role, and existing favorites remain unchanged.

## Research and Editorial Policy

Public interview reports from Nowcoder and appropriately licensed GitHub repositories determine topic selection and follow-up depth. They are discovery evidence only.

Technical answers are verified against primary sources such as original papers, official technical reports, official repositories, specifications, and official product documentation. External wording, diagrams, code, and unverifiable frequency counts are not copied.

Every published node must have:

- Auditable interview-discovery evidence
- At least one primary technical source
- An original Chinese explanation
- Topic-specific distractors
- A manual editorial review marker

Version-sensitive claims include a verification date and a named product or model version. Content validation flags stale version-sensitive material for review.

## Content Architecture

Application content is separated from runtime composition:

- `application/sections/`: node metadata and course order
- `application/questions/`: authored question banks organized by node
- `application/knowledge/`: core and supporting articles
- `application/sources/`: interview evidence, primary sources, licenses, and verification dates
- `application/catalog.ts`: exported units, nodes, and lookup indexes

Resume functionality is separated into:

- `resume/`: client upload, result confirmation, and local structured profile
- CloudBase upload-session function
- CloudBase parsing and analysis function
- Provider-neutral model adapter
- `recommendation/`: deterministic mappings between confirmed resume tags and reviewed public content

Large content files are split by Section or node so individual topics can be reviewed without loading or modifying the complete bank.

## Progress Migration

The existing 25 application node IDs remain stable. Their completion, attempts, learning statistics, review items, and favorites are retained.

New nodes are inserted into the pedagogically correct positions. Completed historical nodes remain replayable. The recommended continuation point becomes the earliest incomplete node in the expanded current path.

No migration modifies:

- Shared Transformer completion
- Algorithm-engineer completion
- XP or streak
- Review queue
- Favorites
- Sound or analytics settings
- Existing local resume or project metadata

## Resume Analysis Experience

Resume analysis is optional and never blocks the public curriculum.

The flow is:

1. The user selects a PDF or DOCX file.
2. The app presents resume-specific consent and a concise data-handling explanation.
3. The app requests a short-lived CloudBase upload session.
4. The file is uploaded to a private temporary path.
5. The service verifies size, declared type, actual file signature, and ownership of the upload session.
6. The parser extracts text, tables, and document sections. Scanned files use OCR.
7. A configurable mainland-available model converts the extracted content into a fixed JSON schema.
8. The service validates the schema and removes unnecessary direct identifiers.
9. The original file and extracted temporary text are deleted whether processing succeeds or fails.
10. The structured result is returned to the app.
11. The user reviews, edits, and explicitly confirms the result.
12. Only the confirmed structure participates in recommendations and follow-up selection.

The model provider is hidden behind a server-side adapter. The first deployment uses a Tencent Cloud-compatible provider configured through CloudBase environment variables. Provider credentials never enter the client bundle.

## Resume Data Model

The returned structure contains only learning-relevant fields:

- Technology stack
- Project or internship category
- Claimed responsibilities
- Data and deployment scale when explicitly present
- Evaluation metrics when explicitly present
- Relevant curriculum topics
- Suggested follow-up categories
- Field-level confidence
- User-confirmation state

The system must not invent missing scale, metrics, responsibilities, or production experience. Missing values remain absent and low-confidence extractions are visibly marked for confirmation.

## Resume Storage and Privacy

Resume analysis uses cloud processing for output quality, but cloud storage is temporary.

- The original file is deleted immediately after successful or failed parsing.
- Extracted raw text is deleted with the original file.
- Structured analysis results are not retained in CloudBase after the response is delivered.
- The confirmed structured profile is stored only on the user's device.
- Uninstalling the app removes the profile and no cross-device synchronization is provided.
- Resume consent is separate from anonymous analytics consent.
- Resume files, text, contact information, and structured profile fields never enter analytics payloads, normal logs, or error messages.
- The user can replace or delete the local structured profile at any time.

Cloud operations use private storage, short-lived upload sessions, ownership checks, encryption in transit, least-privilege service credentials, file-size limits, rate limits, and bounded processing time.

## Recommendation Behavior

Recommendations do not generate a separate unreviewed curriculum.

Confirmed resume tags map deterministically to:

- Existing learning nodes
- Reviewed source exercises
- Knowledge articles
- Reviewed follow-up templates

The course path and strict unlocking order remain unchanged. Resume signals affect priority surfaces such as recommended review, related knowledge, and optional follow-up exercises.

When a resume contains a technology absent from the reviewed catalog, the app shows no generated factual lesson. The topic enters an editorial backlog instead.

## Failure Handling

- Invalid, oversized, encrypted, or unsupported files are rejected before model processing.
- A scanned document with poor OCR returns low-confidence fields for user correction.
- Invalid model JSON is repaired once and then fails with a user-readable error.
- Timeouts, rate limits, and provider outages return retryable states without blocking offline learning.
- Cleanup runs from a guaranteed finalization path and a scheduled sweeper removes abandoned temporary uploads.
- A missing CloudBase or model configuration disables resume analysis with a clear availability state; public curriculum remains fully functional.
- Repeated upload attempts are rate-limited without including resume content in security logs.

## Verification

Automated content validation checks:

- Exactly 8 application Sections and 64 nodes
- Exactly 24 source exercises per node and 1,536 in total
- The required 6/4/4/4/3/3 exercise-category distribution
- At least 112 application knowledge articles
- Stable, unique node, exercise, and article IDs
- Required technology coverage
- Missing primary sources or interview evidence
- Missing editorial review markers
- Duplicate and near-duplicate prompts
- Generic template prompts and generic distractors
- Forbidden handwritten coding tasks
- Broken internal knowledge references
- Stale version-sensitive source metadata

Automated application and backend tests cover:

- Existing-progress migration
- Strict unlocking after node insertion
- Favorites and review preservation
- Adaptive selection from a 24-question bank
- File signature, type, and size validation
- Upload-session ownership and expiry
- Parser, OCR, model, and schema failure paths
- Guaranteed original-file and temporary-text deletion
- Scheduled cleanup of abandoned uploads
- Local-only persistence of confirmed structured results
- Absence of resume fields in analytics and logs
- Deterministic recommendation mappings
- Offline curriculum behavior when resume analysis is unavailable

The release must also pass TypeScript, lint, Expo Doctor, content, math, icon, analytics, and learning tests, plus iOS, Android, and Web export smoke tests. Mobile-sized interactive checks cover the expanded path, knowledge filters, resume consent, upload progress, confirmation, deletion, and recommendations.

## Acceptance Criteria

1. The application-engineer path contains 8 Sections, 64 nodes, and 1,536 authored source exercises.
2. The application knowledge library contains at least 112 sourced articles and covers every required technology area.
3. Repeated attempts draw meaningfully different reviewed exercises without runtime-generated generic prompts.
4. Existing application progress, shared progress, algorithm progress, favorites, review items, XP, and streak are preserved.
5. No exercise requires handwritten code.
6. Resume analysis is optional and does not block offline learning.
7. Resume processing uses explicit separate consent and private temporary cloud storage.
8. Original resume files and extracted text are deleted after both success and failure.
9. Confirmed structured resume results are stored only on the device and can be edited or deleted.
10. Resume content and structured fields never enter anonymous analytics or normal logs.
11. Recommendations select reviewed public material and do not publish unreviewed factual content.
12. All automated validation and three-platform export checks pass.
