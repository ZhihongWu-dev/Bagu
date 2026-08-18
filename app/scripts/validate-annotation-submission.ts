import { resolve } from 'node:path';
import { loadManifest } from './nowcoder-intake/manifest';
import { validateSubmissionDirectory } from './nowcoder-annotation/submission-files';

async function main(): Promise<void> {
  const manifest = await loadManifest(resolve('quality/nowcoder-intake/manifests/pilot-100.json'));
  const result = await validateSubmissionDirectory(resolve('quality/nowcoder-intake/submissions'), manifest);
  if (result.submissionCount === 0) console.log('Annotation submission validation passed: no submission present.');
  else console.log('Annotation submission validation passed: pilot-100-v1.json.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
