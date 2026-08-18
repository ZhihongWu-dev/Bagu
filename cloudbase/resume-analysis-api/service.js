const { normalizeModelResult, redactIdentifiers, requestError, validateUploadRequest } = require('./protocol');

function createResumeService({ storage, parser, model }) {
  return {
    async createUploadSession(input, ownerId) {
      const file = validateUploadRequest(input);
      if (!ownerId) throw requestError(401, '缺少匿名会话身份。');
      return storage.createUploadSession({ ...file, ownerId, expiresInSeconds: 600 });
    },

    async analyze(sessionId, ownerId) {
      if (!sessionId || !ownerId) throw requestError(400, '上传会话无效。');
      const stored = await storage.claim(sessionId, ownerId);
      if (!stored) throw requestError(404, '上传会话不存在或已过期。');
      try {
        const parsed = await parser.extract(stored);
        const redacted = redactIdentifiers(parsed.text).slice(0, 120_000);
        if (redacted.trim().length < 40) throw requestError(422, '未能从简历中提取足够文字。');
        const result = await model.analyze(redacted);
        return normalizeModelResult(result);
      } finally {
        await storage.remove(stored).catch(() => undefined);
      }
    },

    async sweep() { return storage.removeExpired(); },
  };
}

module.exports = { createResumeService };
