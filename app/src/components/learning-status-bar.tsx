import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { colors } from '@/theme/colors';
import type { AppIconName } from '@/types/icons';

type Props = {
  streak: number;
  xp: number;
  focus: number;
};

export function LearningStatusBar({ streak, xp, focus }: Props) {
  return (
    <View style={styles.bar} accessibilityRole="summary">
      <StatusItem accessibilityLabel={`连续学习 ${streak} 天`} icon="flame" value={streak} color={colors.currentDark} />
      <StatusItem accessibilityLabel={`${xp} 经验值`} icon="gem" value={xp} color={colors.primary} />
      <StatusItem accessibilityLabel={`${focus} 点专注值`} icon="bolt" value={focus} color={colors.successDark} />
    </View>
  );
}

function StatusItem({ accessibilityLabel, icon, value, color }: { accessibilityLabel: string; icon: AppIconName; value: number; color: string }) {
  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.item}>
      <AppIcon name={icon} size={19} color={color} strokeWidth={2.5} />
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 6,
  },
  item: {
    minWidth: 0,
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 15,
  },
  value: { fontSize: 15, fontWeight: '900', fontVariant: ['tabular-nums'] },
});
