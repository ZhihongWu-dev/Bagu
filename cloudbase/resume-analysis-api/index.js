const { createResumeService } = require('./service');

let service;

function configure(nextService) { service = nextService; }

async function main(event = {}, context = {}) {
  const path = event.path || event.rawPath || '/';
  const method = event.httpMethod || event.requestContext?.http?.method || 'POST';
  if (method === 'GET' && path.endsWith('/health')) return response(200, { ok: true, configured: Boolean(service) });
  if (!service) return response(503, { error: '简历分析服务尚未绑定私有存储、解析器和模型适配器。' });
  const ownerId = context.OPENID || event.headers?.['x-bagu-session'] || '';
  try {
    const body = parseBody(event.body);
    if (method === 'POST' && path.endsWith('/upload-session')) return response(200, await service.createUploadSession(body, ownerId));
    if (method === 'POST' && path.endsWith('/analyze')) return response(200, await service.analyze(body.sessionId, ownerId));
    if (method === 'POST' && path.endsWith('/cleanup')) return response(200, await service.sweep());
    return response(404, { error: '接口不存在。' });
  } catch (error) {
    return response(Number(error.status) || 500, { error: Number(error.status) ? error.message : '服务暂时不可用。' });
  }
}

function parseBody(value) { if (!value) return {}; if (typeof value === 'object') return value; try { return JSON.parse(value); } catch { return {}; } }
function response(statusCode, body) { return { statusCode, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, body: JSON.stringify(body) }; }

module.exports = { configure, main };
