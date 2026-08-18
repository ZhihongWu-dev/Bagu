import { File } from 'expo-file-system';

import type { ResumeAnalysisProfile } from '@/types/course';

const baseUrl = (process.env.EXPO_PUBLIC_RESUME_API_URL ?? '').replace(/\/$/, '');
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const allowedTypes = new Set(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

export type ResumeAsset = { uri: string; name: string; size?: number; mimeType?: string | null };

export function resumeAnalysisAvailable() {
  return baseUrl.length > 0;
}

export function validateResumeAsset(asset: ResumeAsset) {
  if (!asset.name.toLowerCase().endsWith('.pdf') && !asset.name.toLowerCase().endsWith('.docx')) throw new Error('只支持 PDF 或 DOCX 简历。');
  if (asset.mimeType && !allowedTypes.has(asset.mimeType)) throw new Error('文件类型与扩展名不匹配。');
  if ((asset.size ?? 0) > MAX_FILE_SIZE) throw new Error('简历不能超过 8 MB。');
}

export async function analyzeResume(asset: ResumeAsset): Promise<ResumeAnalysisProfile> {
  validateResumeAsset(asset);
  if (!baseUrl) throw new Error('简历分析服务尚未配置。');
  const sessionResponse = await fetch(`${baseUrl}/upload-session`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: asset.name, size: asset.size ?? 0, mimeType: asset.mimeType }),
  });
  if (!sessionResponse.ok) throw new Error(await readableError(sessionResponse, '无法创建安全上传会话。'));
  const session = await sessionResponse.json() as { sessionId: string; uploadUrl: string; headers?: Record<string, string> };
  const bytes = await new File(asset.uri).bytes();
  const uploadResponse = await fetch(session.uploadUrl, { method: 'PUT', headers: { 'Content-Type': asset.mimeType ?? 'application/octet-stream', ...(session.headers ?? {}) }, body: bytes as unknown as BodyInit });
  if (!uploadResponse.ok) throw new Error('简历上传失败，临时文件将自动清理。');
  const analysisResponse = await fetch(`${baseUrl}/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: session.sessionId }) });
  if (!analysisResponse.ok) throw new Error(await readableError(analysisResponse, '简历解析失败。'));
  return normalizeAnalysis(await analysisResponse.json(), asset.name);
}

function normalizeAnalysis(value: unknown, sourceName: string): ResumeAnalysisProfile {
  if (!isRecord(value)) throw new Error('解析服务返回了无效结果。');
  return {
    sourceName, experienceType: text(value.experienceType) || '项目经历', technologies: strings(value.technologies), responsibilities: strings(value.responsibilities),
    scale: text(value.scale) || undefined, metrics: strings(value.metrics), topicIds: strings(value.topicIds).filter((id) => id.startsWith('app-')), followUps: strings(value.followUps),
    confidence: Math.max(0, Math.min(1, Number(value.confidence) || 0)), analyzedAt: new Date().toISOString(), confirmed: false,
  };
}

async function readableError(response: Response, fallback: string) { try { const body = await response.json() as { error?: string }; return body.error || fallback; } catch { return fallback; } }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function text(value: unknown) { return typeof value === 'string' ? value.trim().slice(0, 1000) : ''; }
function strings(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim().slice(0, 300)).filter(Boolean).slice(0, 30) : []; }
