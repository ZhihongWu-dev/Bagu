import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import katex from 'katex';

import { knowledgeCards } from '../src/data/knowledge-base';
import { getFormulaCatalogEntries } from '../src/data/math-expression';
import { keywords, transformerNodes } from '../src/data/transformer';
import type { MathExpression } from '../src/types/course';
import { centeredMathLayoutCss, injectCenteredMathLayout } from '../src/components/math-formula-layout';

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
if (!nativeRenderer.includes('automaticallyAdjustContentInsets={false}')) failures.push('Native renderer must disable automatic iOS content insets.');
if (!nativeRenderer.includes('contentInsetAdjustmentBehavior="never"')) failures.push('Native renderer must disable iOS inset adjustment behavior.');

const centeredLayoutRequirements = [
  'justify-content: center !important',
  'width: max-content !important',
  'min-width: 100% !important',
  'overflow-x: auto !important',
  'white-space: nowrap !important',
  'min-height: var(--bagu-math-min-height) !important',
  'align-items: center !important',
];
centeredLayoutRequirements.forEach((requirement) => {
  if (!centeredMathLayoutCss.includes(requirement)) failures.push(`Native centered layout is missing: ${requirement}.`);
});
const injectedLayout = injectCenteredMathLayout('<html><head></head><body></body></html>', 54);
if (!injectedLayout.includes('data-bagu-math-layout')) failures.push('Native centered layout was not injected into KaTeX HTML.');
if (!injectedLayout.includes('--bagu-math-min-height: 54px')) failures.push('Native centered layout must align to the WebView minimum height.');

const webRenderer = readFileSync(join(process.cwd(), 'src', 'components', 'math-formula.web.tsx'), 'utf8');
['minWidth: \'100%\'', "width: 'max-content'", "justifyContent: 'center'", "display: 'flex'"].forEach((requirement) => {
  if (!webRenderer.includes(requirement)) failures.push(`Web centered layout is missing: ${requirement}.`);
});

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
