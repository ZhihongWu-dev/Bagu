import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import type { Lesson } from '@/types/course';

type Props = {
  lesson: Lesson;
  completed: boolean;
  current: boolean;
  unlocked: boolean;
  offset: number;
  accentColor: string;
  accentDarkColor: string;
  onPress: () => void;
};

export function LessonNode({ lesson, completed, current, unlocked, offset, accentColor, accentDarkColor, onPress }: Props) {
  const available = completed || unlocked;
  const stateLabel = completed ? '已完成，可重新练习' : current ? '当前课程' : available ? '可学习' : '尚未解锁';
  const faceColor = completed ? colors.success : current ? colors.current : available ? accentColor : '#E9E6EF';
  const sideColor = completed ? colors.successDark : current ? colors.currentDark : available ? accentDarkColor : '#CFC9D8';

  return (
    <View style={[styles.row, { transform: [{ translateX: offset }] }]}>
      {current ? <View style={styles.callout}><Text style={styles.calloutText}>开始</Text><View style={styles.caret} /></View> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${lesson.title}，${stateLabel}`}
        accessibilityState={{ disabled: !available, selected: current }}
        disabled={!available}
        hitSlop={7}
        onPress={onPress}
        style={styles.node}>
        {({ pressed }) => (
          <>
            <View style={[styles.cylinderSide, { backgroundColor: sideColor }]} />
            <View style={[styles.cylinderFace, { backgroundColor: faceColor }, pressed && available && styles.facePressed]}>
              <Text style={[styles.nodeText, !available && styles.lockedText]}>{completed ? '✓' : available ? lesson.icon : '🔒'}</Text>
            </View>
          </>
        )}
      </Pressable>
      {current ? <Text numberOfLines={1} style={styles.title}>{lesson.shortTitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 135, alignItems: 'center', justifyContent: 'flex-start', zIndex: 1 },
  callout: { pointerEvents: 'none', minWidth: 62, alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 8, boxShadow: '0 3px 8px rgba(41, 35, 61, 0.10)' },
  calloutText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  caret: { position: 'absolute', bottom: -6, width: 10, height: 10, backgroundColor: colors.surface, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: colors.border, transform: [{ rotate: '45deg' }] },
  node: { width: 82, height: 74 },
  cylinderSide: { position: 'absolute', left: 2, right: 2, top: 8, bottom: 0, borderRadius: 39 },
  cylinderFace: { position: 'absolute', left: 2, right: 2, top: 0, height: 66, alignItems: 'center', justifyContent: 'center', borderRadius: 39, boxShadow: '0 7px 14px rgba(41, 35, 61, 0.14)' },
  facePressed: { transform: [{ translateY: 7 }] },
  nodeText: { color: colors.surface, fontSize: 27, fontWeight: '900' },
  lockedText: { fontSize: 19, opacity: 0.62 },
  title: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 8 },
});
