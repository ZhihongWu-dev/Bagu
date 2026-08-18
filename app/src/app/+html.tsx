import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta content="IE=edge" httpEquiv="X-UA-Compatible" />
        <meta content="width=device-width, initial-scale=1, shrink-to-fit=no" name="viewport" />
        <ScrollViewStyleReset />
        <link href="/katex/katex.min.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
