import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import katex from 'katex';

import { knowledgeCards } from '../src/data/knowledge-base';
import { getFormulaCatalogEntries } from '../src/data/math-expression';
import { keywords, transformerNodes } from '../src/data/transformer';
import type { MathExpression } from '../src/types/course';

const failures: string[] = [];
const catalog = getFormulaCatalogEntries();
const catalogPlainText = new Set(catalog.map((entry) => entry.plainText));
const used: { owner: string; expression: MathExpression }[] = [];

for (const entry of catalog) {
  if (!entry.plainText.trim()) failures.push('Formula catalog contains empty plainText.');
  if (!entry.latex.trim()) failures.push(`Formula ${entry.plainText} has empty LaTeX.`);
  try {
    katex.renderToString(entry.latex, {
      displayMode: true,
      output: 'htmlAndMathml',
      strict: 'error',
      throwOnError: true,
      trust: false,
    });
  } catch (error) {
    failures.push(`${entry.plainText}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

knowledgeCards.forEach((card) => {
  if (card.formula) used.push({ owner: `knowledge:${card.id}`, expression: card.formula });
});

transformerNodes.forEach((node) => {
  node.exercises.forEach((exercise) => {
    if (exercise.formula) used.push({ owner: `exercise:${exercise.id}`, expression: exercise.formula });
    if (exercise.type === 'single-choice' || exercise.type === 'multiple-choice' || exercise.type === 'ordering') {
      exercise.choices.forEach((choice) => {
        if (choice.formula) used.push({ owner: `choice:${exercise.id}:${choice.id}`, expression: choice.formula });
      });
    }
  });
});

Object.values(keywords).forEach((keyword) => {
  if (keyword.formula) used.push({ owner: `keyword:${keyword.id}`, expression: keyword.formula });
});

used.forEach(({ owner, expression }) => {
  if (!catalogPlainText.has(expression.plainText)) failures.push(`${owner} uses a formula outside the catalog.`);
  if (!expression.latex.trim()) failures.push(`${owner} has empty LaTeX.`);
});

const uiFiles = [
  join(process.cwd(), 'src', 'app', 'lesson', '[id].tsx'),
  join(process.cwd(), 'src', 'app', 'knowledge', '[id].tsx'),
  join(process.cwd(), 'src', 'components', 'keyword-sheet.tsx'),
];
const directTextFormula = /<Text[^>]*>\s*\{(?:card|exercise|keyword|choice)\.formula\}\s*<\/Text>/u;
uiFiles.forEach((path) => {
  const source = readFileSync(path, 'utf8');
  if (directTextFormula.test(source)) failures.push(`${path}: structured formula is rendered as plain Text.`);
});

const nativeRenderer = readFileSync(join(process.cwd(), 'src', 'components', 'math-formula.tsx'), 'utf8');
if (/https?:\/\/|cdn\.|unpkg|jsdelivr/u.test(nativeRenderer)) failures.push('Native formula renderer must not depend on network resources.');
if (!nativeRenderer.includes('createKaTeXHTML')) failures.push('Native renderer must use bundled KaTeX HTML.');

const htmlRoot = readFileSync(join(process.cwd(), 'src', 'app', '+html.tsx'), 'utf8');
if (!htmlRoot.includes('/katex/katex.min.css')) failures.push('Web document must load the vendored KaTeX stylesheet.');
const webCss = readFileSync(join(process.cwd(), 'public', 'katex', 'katex.min.css'), 'utf8');
const fontFiles = [...webCss.matchAll(/url\((?:["'])?fonts\/([^"')]+)/gu)].map((match) => match[1]);
if (!fontFiles.length) failures.push('Vendored KaTeX stylesheet does not reference fonts.');
new Set(fontFiles).forEach((font) => {
  try {
    readFileSync(join(process.cwd(), 'public', 'katex', 'fonts', font));
  } catch {
    failures.push(`Missing vendored KaTeX font: ${font}.`);
  }
});

if (failures.length) {
  console.error(`Math validation failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Math validation passed: ${catalog.length} catalog formulas compiled, ${used.length} structured uses verified, and native/Web rendering is offline.`);
