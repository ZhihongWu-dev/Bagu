const crypto = require('node:crypto');

const MAX_BYTES = 8 * 1024 * 1024;
const allowed = new Map([
  ['application/pdf', '.pdf'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
]);

function validateUploadRequest(input) {
  if (!input || typeof input !== 'object') throw requestError(400, '请求格式无效。');
  const name = safeText(input.name, 180);
  const mimeType = safeText(input.mimeType, 120);
  const size = Number(input.size);
  if (!name || !allowed.has(mimeType) || !name.toLowerCase().endsWith(allowed.get(mimeType))) throw requestError(415, '只支持真实类型匹配的 PDF 或 DOCX。');
  if (!Number.isFinite(size) || size <= 0 || size > MAX_BYTES) throw requestError(413, '简历大小必须在 8 MB 以内。');
  return { name, mimeType, size };
}

function createSessionId() { return crypto.randomBytes(24).toString('hex'); }

function normalizeModelResult(input) {
  if (!input || typeof input !== 'object') throw requestError(502, '模型返回格式无效。');
  return {
    experienceType: safeText(input.experienceType, 120) || '项目经历',
    technologies: stringList(input.technologies, 30), responsibilities: stringList(input.responsibilities, 20), scale: safeText(input.scale, 300) || undefined,
    metrics: stringList(input.metrics, 20), topicIds: stringList(input.topicIds, 30).filter((id) => id.startsWith('app-')), followUps: stringList(input.followUps, 20),
    confidence: Math.max(0, Math.min(1, Number(input.confidence) || 0)),
  };
}

function redactIdentifiers(text) {
  return String(text || '')
    .replace(/\b1[3-9]\d{9}\b/g, '[PHONE]')
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[EMAIL]')
    .replace(/\b\d{15,18}[0-9Xx]\b/g, '[ID]');
}

function safeText(value, limit) { return typeof value === 'string' ? value.trim().slice(0, limit) : ''; }
function stringList(value, limit) { return Array.isArray(value) ? value.filter((item) => typeof item === 'string').map((item) => safeText(item, 300)).filter(Boolean).slice(0, limit) : []; }
function requestError(status, message) { const error = new Error(message); error.status = status; return error; }

module.exports = { MAX_BYTES, createSessionId, normalizeModelResult, redactIdentifiers, requestError, validateUploadRequest };
