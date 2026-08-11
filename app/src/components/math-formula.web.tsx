import katex from 'katex';
import { createElement, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import type { MathFormulaProps } from '@/components/math-formula';

export function MathFormula({ expression, color = colors.text, compact = false, fontSize = 17, style }: MathFormulaProps) {
  const result = useMemo(() => {
    try {
      return {
        html: katex.renderToString(expression.latex, {
          displayMode: true,
          output: 'htmlAndMathml',
          strict: 'error',
          throwOnError: true,
          trust: false,
        }),
      };
    } catch {
      return { html: null };
    }
  }, [expression.latex]);

  if (!result.html) {
    return (
      <View accessibilityLabel={`公式：${expression.plainText}`} style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>公式暂时无法显示</Text>
      </View>
    );
  }

  const formulaElement = createElement('div', {
    dangerouslySetInnerHTML: { __html: result.html },
    style: {
      color,
      fontSize,
      lineHeight: compact ? 1.35 : 1.6,
      minWidth: 'max-content',
      padding: compact ? '3px 5px' : '7px 8px',
    },
  });

  return (
    <View
      accessible
      accessibilityLabel={`公式：${expression.plainText}`}
      style={[styles.container, compact && styles.compact, style]}>
      {formulaElement}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', overflowX: 'auto' },
  compact: { minHeight: 38 },
  fallback: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
});
