const assert = require('node:assert/strict');
const { normalizeModelResult, redactIdentifiers, validateUploadRequest } = require('./protocol');
const { createResumeService } = require('./service');

assert.equal(validateUploadRequest({ name: 'resume.pdf', mimeType: 'application/pdf', size: 1024 }).name, 'resume.pdf');
assert.throws(() => validateUploadRequest({ name: 'resume.exe', mimeType: 'application/pdf', size: 1024 }));
assert.throws(() => validateUploadRequest({ name: 'resume.pdf', mimeType: 'application/pdf', size: 9 * 1024 * 1024 }));
assert.match(redactIdentifiers('13800138000 a@example.com 110101199001011234'), /\[PHONE\].*\[EMAIL\].*\[ID\]/);
assert.deepEqual(normalizeModelResult({ technologies: ['Redis'], topicIds: ['app-cache-redis', 'bad'], confidence: 2 }).topicIds, ['app-cache-redis']);

let removed = false;
const service = createResumeService({
  storage: { createUploadSession: async () => ({}), claim: async () => ({ id: 'x' }), remove: async () => { removed = true; }, removeExpired: async () => ({ removed: 0 }) },
  parser: { extract: async () => ({ text: '这是一份包含足够项目经历、技术栈、职责、评测指标和工程结果的测试简历文本。'.repeat(3) }) },
  model: { analyze: async () => { throw new Error('provider failed'); } },
});

service.analyze('session', 'owner').then(() => assert.fail('expected failure')).catch(() => {
  assert.equal(removed, true, 'temporary file must be removed after model failure');
  let parserRemoved = false;
  const parserFailure = createResumeService({
    storage: { claim: async () => ({ id: 'y' }), remove: async () => { parserRemoved = true; }, removeExpired: async () => ({ removed: 0 }) },
    parser: { extract: async () => { throw new Error('bad pdf'); } }, model: { analyze: async () => ({}) },
  });
  return parserFailure.analyze('session', 'owner').then(() => assert.fail('expected parser failure')).catch(() => {
    assert.equal(parserRemoved, true, 'temporary file must be removed after parser failure');
    console.log('resume analysis protocol tests passed');
  });
});
