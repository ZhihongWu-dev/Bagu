import type { ApprovalStatus, PageType, TopicId } from '../nowcoder-intake/types';

export type AnnotationStatus = 'pending' | 'completed' | 'skipped';
export type Relevance = 'relevant' | 'not-relevant' | 'uncertain';
export type Role = 'llm_algorithm' | 'llm_application' | 'shared' | 'unknown';
export type RecruitingStage = 'campus-autumn' | 'campus-other' | 'unknown';
export type FollowUpType = 'principle' | 'boundary' | 'debugging' | 'metrics' | 'system-design' | 'tradeoff';
export type MisconceptionType = 'concept-confusion' | 'missing-condition' | 'causal-reversal' | 'complexity-error' | 'metric-misuse';
export type CognitiveLevel = 'foundation' | 'application' | 'deep';
export type DistractorType = 'implausible' | 'overlap' | 'absolute-claim' | 'different-scope' | 'missing-condition' | 'non-unique-answer';
export type AnswerCueType = 'length' | 'position' | 'wording' | 'format' | 'stem-repeat';
export type SkipReason = 'login-unavailable' | 'page-missing' | 'insufficient-content' | 'irrelevant' | 'duplicate' | 'cannot-assess' | 'other';

export interface ChoiceSignals {
  cognitiveLevel: CognitiveLevel;
  distractorTypes: DistractorType[];
  answerCueTypes: AnswerCueType[];
}

export interface ManualAnnotation {
  sourceId: string;
  status: AnnotationStatus;
  relevance?: Relevance;
  role?: Role;
  recruitingStage?: RecruitingStage;
  topicIds?: TopicId[];
  followUpTypes?: FollowUpType[];
  misconceptionTypes?: MisconceptionType[];
  choiceSignals?: ChoiceSignals;
  summary?: string;
  skipReason?: SkipReason;
  skipNote?: string;
  updatedAt: string;
}

export interface ManualAnnotationDataset {
  schemaVersion: 1;
  manifestVersion: 1;
  annotations: Record<string, ManualAnnotation>;
}

export interface AnnotationCandidate {
  sourceId: string;
  url: string;
  pageType: PageType;
  approvalStatus: ApprovalStatus;
  discoveryQuery: string;
  reviewNote?: string;
}

export interface AnnotationProgress {
  total: number;
  completed: number;
  pending: number;
  skipped: number;
  nextSourceId?: string;
}

export interface AnnotationReport extends AnnotationProgress {
  schemaVersion: 1;
  relevant: number;
  notRelevant: number;
  uncertain: number;
  generatedAt: string;
}

export interface TopicSummary {
  schemaVersion: 1;
  generatedAt: string;
  contributingSources: number;
  byRole: Record<string, number>;
  byPageType: Record<string, number>;
  byTopic: Record<string, number>;
  byFollowUpType: Record<string, number>;
}
