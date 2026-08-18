import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SourceManifest } from '../nowcoder-intake/types';
import { ANNOTATION_SUBMISSION_FILENAME, validateAnnotationSubmission } from './submission';

export interface SubmissionDirectoryResult {
  submissionCount: 0 | 1;
  submissionPath?: string;
}

export async function validateSubmissionDirectory(directory: string, manifest: SourceManifest): Promise<SubmissionDirectoryResult> {
  let names: string[];
  try {
    names = (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { submissionCount: 0 };
    throw error;
  }
  if (names.length === 0) return { submissionCount: 0 };
  if (names.length !== 1 || names[0] !== ANNOTATION_SUBMISSION_FILENAME) throw new Error('invalid_submission_filename');
  const submissionPath = join(directory, ANNOTATION_SUBMISSION_FILENAME);
  let value: unknown;
  try {
    value = JSON.parse(await readFile(submissionPath, 'utf8'));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('invalid_submission_json');
    throw error;
  }
  validateAnnotationSubmission(value, manifest);
  return { submissionCount: 1, submissionPath };
}
