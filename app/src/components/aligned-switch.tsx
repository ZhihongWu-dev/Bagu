import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/theme/colors';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
};

export function AlignedSwitch({ value, onValueChange, accessibilityLabel, disabled = false }: Props) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={() => onValueChange(!value)}
      style={[styles.touchTarget, disabled && styles.disabled]}>
      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.thumb, value && styles.thumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchTarget: { width: 58, height: 44, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  track: { width: 52, height: 32, justifyContent: 'center', padding: 4, backgroundColor: colors.locked, borderRadius: 16 },
  trackOn: { backgroundColor: colors.success },
  thumb: { width: 24, height: 24, backgroundColor: colors.surface, borderRadius: 12, boxShadow: '0 2px 5px rgba(41,35,61,0.22)' },
  thumbOn: { transform: [{ translateX: 20 }] },
});
