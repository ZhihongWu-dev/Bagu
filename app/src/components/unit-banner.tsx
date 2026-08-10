import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

type Props = {
  title: string;
  completed: number;
  total: number;
};

export function UnitBanner({ title, completed, total }: Props) {
  const percent = total ? Math.min(100, (completed / total) * 100) : 0;

  return (
    <View style={styles.banner} accessibilityLabel={`${title}，已完成 ${completed} / ${total}`}>
      <View style={styles.row}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        <Text style={styles.progress}>{completed}/{total}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    gap: 14,
    backgroundColor: colors.primary,
    borderBottomWidth: 7,
    borderBottomColor: colors.primaryDark,
    borderRadius: 22,
    padding: 18,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1, color: colors.surface, fontSize: 20, fontWeight: '900' },
  progress: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    backgroundColor: 'rgba(255,255,255,0.17)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  track: { height: 8, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 8, pointerEvents: 'none' },
  fill: { height: '100%', backgroundColor: colors.surface, borderRadius: 8 },
});
