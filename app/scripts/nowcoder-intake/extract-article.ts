import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface ExtractedArticle {
  title: string;
  text: string;
}

export function extractArticle(html: string, url: string): ExtractedArticle | null {
  const dom = new JSDOM(html, { url, runScripts: 'outside-only' });
  try {
    const document = dom.window.document;
    for (const element of document.querySelectorAll('script,style,iframe,img,video,audio,form,noscript')) element.remove();
    const article = new Readability(document, { charThreshold: 30 }).parse();
    const text = (article?.textContent ?? document.querySelector('main,article')?.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (text.length < 40) return null;
    return { title: (article?.title ?? document.title ?? '').trim(), text };
  } finally {
    dom.window.close();
  }
}
