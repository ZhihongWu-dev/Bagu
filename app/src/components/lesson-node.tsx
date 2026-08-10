import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import type { Lesson } from '@/types/course';

type Props = {
  lesson: Lesson;
  completed: boolean;
  current: boolean;
  unlocked: boolean;
  offset: number;
  onPress: () => void;
};

export function LessonNode({ lesson, completed, current, unlocked, offset, onPress }: Props) {
  const available = completed || unlocked;
  const stateLabel = completed ? '已完成，可重新练习' : current ? '当前课程' : available ? '可学习' : '尚未解锁';

  return (
    <View style={[styles.row, { transform: [{ translateX: offset }] }]}>
      {current ? (
        <View style={styles.callout}>
          <Text style={styles.calloutText}>开始</Text>
          <View style={styles.caret} />
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${lesson.title}，${stateLabel}`}
        accessibilityState={{ disabled: !available, selected: current }}
        disabled={!available}
        hitSlop={6}
        onPress={onPress}
        style={({ pressed }) => [
          styles.node,
          completed && styles.completed,
          current && styles.current,
          !available && styles.locked,
          pressed && available && styles.pressed,
        ]}>
        <Text style={[styles.nodeText, !available && styles.lockedText]}>
          {completed ? '✓' : available ? lesson.icon : '🔒'}
        </Text>
      </Pressable>
      {current ? <Text numberOfLines={1} style={styles.title}>{lesson.shortTitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 142, alignItems: 'center', justifyContent: 'flex-start', zIndex: 1 },
  callout: {
    pointerEvents: 'none',
    minWidth: 62,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 8,
    boxShadow: '0 3px 8px rgba(41, 35, 61, 0.10)',
  },
  calloutText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  caret: {
    position: 'absolute',
    bottom: -6,
    width: 10,
    height: 10,
    backgroundColor: colors.surface,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.border,
    transform: [{ rotate: '45deg' }],
  },
  node: {
    width: 76,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderBottomWidth: 7,
    borderBottomColor: '#C9C1E7',
    borderRadius: 38,
  },
  completed: { backgroundColor: colors.success, borderBottomColor: colors.successDark },
  current: {
    backgroundColor: colors.current,
    borderBottomColor: colors.currentDark,
    boxShadow: '0 8px 18px rgba(255, 181, 38, 0.30)',
  },
  locked: { backgroundColor: '#E9E6EF', borderBottomColor: '#D1CBD9' },
  pressed: { transform: [{ translateY: 4 }], borderBottomWidth: 3 },
  nodeText: { color: colors.surface, fontSize: 27, fontWeight: '900' },
  lockedText: { fontSize: 19, opacity: 0.55 },
  title: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 9 },
});
