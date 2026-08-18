import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Finding = {
  code: string;
  reason: string;
  evidence: string;
  sourceUrl?: string;
  sourceLocator?: string;
};

type RoleVerdict = 'pass' | 'revise' | 'reject';
type Score = { score: number; reason: string };

type EvidenceAudit = {
  reviewerRole: 'evidence';
  reviewerState: 'uncalibrated';
  questions: {
    questionId: string;
    questionVersion: number;
    verdict: RoleVerdict;
    gates: { factuallyCorrect: boolean; conditionsComplete: boolean; sourcesVerifiable: boolean };
    findings: Finding[];
  }[];
};

type ItemAudit = {
  reviewerRole: 'item-quality';
  reviewerState: 'uncalibrated';
  questions: {
    questionId: string;
    questionVersion: number;
    verdict: RoleVerdict;
    gates: { uniqueAnswer: boolean; noAnswerLeakage: boolean; explanationAligned: boolean };
    anchoredScores: { reasoningDepth: Score; distractorQuality: Score; explanationAlignment: Score; clarity: Score };
    findings: Finding[];
  }[];
};

const qualityRoot = join(process.cwd(), 'quality', 'transformer');
const auditRoot = join(qualityRoot, 'audits', 'attention');
const outputRoot = join(qualityRoot, 'reviews', 'attention');
const evidence = readJson<EvidenceAudit>(join(auditRoot, 'evidence-review.post-rework.json'));
const item = readJson<ItemAudit>(join(auditRoot, 'item-quality-review.post-rework.json'));

if (evidence.reviewerRole !== 'evidence' || evidence.reviewerState !== 'uncalibrated') throw new Error('Invalid evidence audit metadata');
if (item.reviewerRole !== 'item-quality' || item.reviewerState !== 'uncalibrated') throw new Error('Invalid item-quality audit metadata');
if (evidence.questions.length !== 60 || item.questions.length !== 60) throw new Error('Both audits must cover exactly 60 questions');

const itemById = new Map(item.questions.map((question) => [question.questionId, question]));
mkdirSync(outputRoot, { recursive: true });

for (const evidenceQuestion of evidence.questions) {
  const itemQuestion = itemById.get(evidenceQuestion.questionId);
  if (!itemQuestion) throw new Error(`Missing item-quality audit for ${evidenceQuestion.questionId}`);
  if (evidenceQuestion.questionVersion !== itemQuestion.questionVersion) throw new Error(`Version mismatch for ${evidenceQuestion.questionId}`);

  const roleVerdicts = [evidenceQuestion.verdict, itemQuestion.verdict];
  const roleVerdictForRecord = (verdict: RoleVerdict) => verdict === 'pass' ? 'uncalibrated' : verdict;
  const hasReject = roleVerdicts.includes('reject');
  const hasRevision = roleVerdicts.includes('revise');
  const record = {
    schemaVersion: 1,
    questionId: evidenceQuestion.questionId,
    questionVersion: evidenceQuestion.questionVersion,
    calibrationStatus: 'uncalibrated',
    evidenceReview: {
      reviewerRole: 'evidence',
      verdict: roleVerdictForRecord(evidenceQuestion.verdict),
      findings: evidenceQuestion.findings,
    },
    itemQualityReview: {
      reviewerRole: 'item-quality',
      verdict: roleVerdictForRecord(itemQuestion.verdict),
      findings: itemQuestion.findings,
    },
    hardGates: { ...evidenceQuestion.gates, ...itemQuestion.gates },
    anchoredScores: itemQuestion.anchoredScores,
    verdict: hasReject ? 'reject' : hasRevision ? 'revise' : 'uncalibrated',
    ...(evidenceQuestion.verdict !== itemQuestion.verdict
      ? { conflictReason: `Independent reviewers disagreed: evidence=${evidenceQuestion.verdict}, item-quality=${itemQuestion.verdict}.` }
      : {}),
  };

  writeFileSync(join(outputRoot, `${evidenceQuestion.questionId}.json`), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
}

if (itemById.size !== evidence.questions.length) throw new Error('Item-quality audit contains duplicate or extra question IDs');
console.log(`Built ${evidence.questions.length} uncalibrated review records.`);

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}
