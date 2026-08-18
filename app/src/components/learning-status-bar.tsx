import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { colors } from '@/theme/colors';

type Props = {
  streak: number;
};

export function LearningStatusBar({ streak }: Props) {
  return (
    <View style={styles.bar}>
      <View accessible accessibilityLabel={`连续学习 ${streak} 天`} style={styles.item}>
        <AppIcon name="flame" size={27} color={colors.flame} />
        <Text style={styles.value}>{streak}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
  },
  item: {
    minWidth: 54,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
  },
  value: { color: colors.flame, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
});
