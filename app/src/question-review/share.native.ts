import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function shareAnnotationExport(contents: string, format: 'json' | 'csv'): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('当前设备不支持系统分享');
  const file = new File(Paths.cache, `bagu-question-annotations.${format}`);
  file.write(contents);
  await Sharing.shareAsync(file.uri, {
    dialogTitle: '导出题目标注',
    mimeType: format === 'json' ? 'application/json' : 'text/csv',
    UTI: format === 'json' ? 'public.json' : 'public.comma-separated-values-text',
  });
}
