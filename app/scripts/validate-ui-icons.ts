import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const sourceRoot = join(process.cwd(), 'src');
const bannedGlyphs = /[★☆◆◷◉⌕♪✓›‹↗]|[\u{1F300}-\u{1FAFF}]/u;
const characterIconNodes = />\s*[×+−]\s*</u;
const failures: string[] = [];

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.tsx') ? [path] : [];
  });
}

for (const path of walk(sourceRoot)) {
  const source = readFileSync(path, 'utf8');
  if (bannedGlyphs.test(source)) failures.push(`${path}: contains an Emoji or character icon.`);
  if (characterIconNodes.test(source)) failures.push(`${path}: contains a text character used as an icon.`);
}

const coursePath = readFileSync(join(sourceRoot, 'components', 'course-path.tsx'), 'utf8');
if (/styles\.guide|style=\{\[styles\.guide/u.test(coursePath)) failures.push('course-path.tsx: center guide line must stay removed.');

const home = readFileSync(join(sourceRoot, 'app', '(tabs)', 'index.tsx'), 'utf8');
if (/<UnitBanner/u.test(home)) failures.push('Home screen must open directly on the Section learning path without a Unit banner.');

const lessonNode = readFileSync(join(sourceRoot, 'components', 'lesson-node.tsx'), 'utf8');
if (/companion|bagu-companion/u.test(lessonNode)) failures.push('Learning-path companion must remain hidden until a replacement is approved.');

if (failures.length) {
  console.error(`UI icon validation failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('UI validation passed: no Emoji/character icons, Unit banner, companion, or learning-path guide line.');
