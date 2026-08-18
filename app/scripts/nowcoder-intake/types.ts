export type PageType = 'interview' | 'multiple-choice';
export type ApprovalStatus = 'discovered' | 'approved' | 'rejected';

export interface SourceManifestEntry {
  sourceId: string;
  url: string;
  pageType: PageType;
  approvalStatus: ApprovalStatus;
  discoveryQuery: string;
  discoveredAt: string;
  reviewNote?: string;
}

export interface SourceManifest {
  manifestVersion: 1;
  sources: SourceManifestEntry[];
}

export type IntakeStatus =
  | 'success'
  | 'not_approved'
  | 'robots_disallowed'
  | 'robots_unavailable'
  | 'redirect_blocked'
  | 'unsupported_page'
  | 'insufficient_signal'
  | 'privacy_rejected'
  | 'duplicate_content'
  | 'network_error';

export type TopicId =
  | 'transformer-attention'
  | 'position-encoding'
  | 'training-objectives'
  | 'sft-lora-quantization'
  | 'alignment-rlhf-dpo-grpo'
  | 'inference-serving-vllm'
  | 'kv-cache-performance'
  | 'rag-retrieval-rerank'
  | 'redis-vector-database'
  | 'agent-tool-workflow'
  | 'evaluation-safety-observability';

export interface SourceSignal {
  schemaVersion: 1;
  sourceId: string;
  sourceUrl: string;
  pageType: PageType;
  collectedAt: string;
  contentHash: string;
  role: 'llm_algorithm' | 'llm_application' | 'shared' | 'unknown';
  recruitingStage: 'campus-autumn' | 'campus-other' | 'unknown';
  year?: number;
  topicIds: TopicId[];
  followUpTypes: ('principle' | 'boundary' | 'debugging' | 'metrics' | 'system-design' | 'tradeoff')[];
  misconceptionTypes: ('concept-confusion' | 'missing-condition' | 'causal-reversal' | 'complexity-error' | 'metric-misuse')[];
  choiceSignals?: {
    cognitiveLevel: 'foundation' | 'application' | 'deep';
    distractorTypes: string[];
    answerCueTypes: string[];
  };
  confidence: 'low' | 'medium' | 'high';
  reviewStatus: 'pending';
}

export interface RejectedSource {
  sourceId: string;
  sourceUrl: string;
  status: Exclude<IntakeStatus, 'success'>;
  reason: string;
}

export interface IntakeReport {
  schemaVersion: 1;
  startedAt: string;
  finishedAt: string;
  requested: number;
  processed: number;
  succeeded: number;
  rejected: number;
  duplicateCount: number;
  statusCounts: Partial<Record<IntakeStatus, number>>;
  stoppedReason?: string;
}
