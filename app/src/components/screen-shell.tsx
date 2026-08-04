import { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { colors } from '@/theme/colors';

export function ScreenShell({ children }: PropsWithChildren) {
  return (
    <View style={styles.page}>
      <View style={styles.phone}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Platform.OS === 'web' ? '#EFEDF5' : colors.background,
  },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: 460,
    backgroundColor: colors.background,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 18px 50px rgba(40, 30, 72, 0.14)',
      },
      default: {},
    }),
  },
});

