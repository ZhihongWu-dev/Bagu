export const centeredMathLayoutCss = String.raw`
  html,
  body {
    width: 100% !important;
    max-width: 100% !important;
    min-height: var(--bagu-math-min-height) !important;
    overflow: hidden !important;
  }

  #outer-wrapper,
  #container {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  #outer-wrapper {
    display: flex !important;
    align-items: center !important;
    min-height: var(--bagu-math-min-height) !important;
  }

  #container {
    overflow-x: auto !important;
    overflow-y: hidden !important;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  #container::-webkit-scrollbar {
    display: none;
  }

  #container .katex-display {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: max-content !important;
    min-width: 100% !important;
    max-width: none !important;
    overflow: visible !important;
    box-sizing: border-box !important;
    text-align: center !important;
  }

  #container .katex-display > .katex {
    display: block !important;
    flex: 0 0 auto !important;
    max-width: none !important;
    overflow: visible !important;
    white-space: nowrap !important;
    text-align: center !important;
  }

  #container .katex-html {
    max-width: none !important;
    overflow: visible !important;
  }
`;

export function injectCenteredMathLayout(document: string, minHeight: number) {
  const closingHead = '</head>';
  if (!document.includes(closingHead)) throw new Error('KaTeX HTML is missing a closing head tag.');
  return document.replace(
    closingHead,
    `<style data-bagu-math-layout>:root { --bagu-math-min-height: ${minHeight}px; }${centeredMathLayoutCss}</style>${closingHead}`,
  );
}
