import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

const items = [
  { label: '学习', icon: '⌂', route: '/' },
  { label: '知识库', icon: '▦', route: '/library' },
  { label: '复习', icon: '◆', route: '/review' },
  { label: '我的', icon: '☺', route: '/profile' },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const active = pathname === item.route;
        return (
          <Pressable key={item.route} onPress={() => router.replace(item.route)} style={styles.item}>
            <Text style={[styles.icon, active && styles.active]}>{item.icon}</Text>
            <Text style={[styles.label, active && styles.active]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingBottom: 8,
  },
  item: { minWidth: 70, alignItems: 'center', gap: 3, paddingVertical: 7 },
  icon: { color: '#A39BAF', fontSize: 23, fontWeight: '900' },
  label: { color: '#9A92A7', fontSize: 11, fontWeight: '800' },
  active: { color: colors.primary },
});

