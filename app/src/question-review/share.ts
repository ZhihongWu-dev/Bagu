export async function shareAnnotationExport(contents: string, format: 'json' | 'csv'): Promise<void> {
  if (typeof document === 'undefined') throw new Error('当前环境不支持文件下载');
  const blob = new Blob([contents], { type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bagu-question-annotations.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}
