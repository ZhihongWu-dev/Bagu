import { KaTeXAutoHeightWebView, createKaTeXHTML } from '@adheil_gupta/react-native-latex-renderer';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import type { MathExpression } from '@/types/course';
import { injectCenteredMathLayout } from '@/components/math-formula-layout';

export type MathFormulaProps = {
  expression: MathExpression;
  color?: string;
  compact?: boolean;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
};

export function MathFormula({ expression, color = colors.text, compact = false, fontSize = 17, style }: MathFormulaProps) {
  const [failed, setFailed] = useState(false);
  const minHeight = compact ? 38 : 54;
  const html = useMemo(() => {
    const document = createKaTeXHTML(
      `$$${expression.latex}$$`,
      { padding: compact ? '3px 5px' : '7px 8px', color, 'background-color': 'transparent' },
      { color, 'font-size': `${fontSize}px`, 'line-height': compact ? '1.35' : '1.6' },
    );

    return injectCenteredMathLayout(document, minHeight);
  }, [color, compact, expression.latex, fontSize, minHeight]);

  if (failed) {
    return (
      <View accessibilityLabel={`公式：${expression.plainText}`} style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>公式暂时无法显示</Text>
      </View>
    );
  }

  return (
    <View accessible accessibilityLabel={`公式：${expression.plainText}`} style={[styles.container, style]}>
      <KaTeXAutoHeightWebView
        source={html}
        minHeight={minHeight}
        containerStyle={{ width: '100%', backgroundColor: 'transparent' }}
        automaticallyAdjustContentInsets={false}
        bounces={false}
        contentInset={{ top: 0, right: 0, bottom: 0, left: 0 }}
        contentInsetAdjustmentBehavior="never"
        javaScriptCanOpenWindowsAutomatically={false}
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
        onShouldStartLoadWithRequest={(request: { url: string }) => request.url.startsWith('about:blank')}
        setSupportMultipleWindows={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignSelf: 'stretch', overflow: 'hidden' },
  fallback: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
});
