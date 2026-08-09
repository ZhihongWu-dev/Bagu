import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/colors';

const tabIcons: Record<string, string> = {
  index: '⌂',
  today: '✓',
  library: '▦',
  review: '◆',
  profile: '☺',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9A92A7',
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.bar,
        tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>{tabIcons[route.name] ?? '•'}</Text>,
      })}>
      <Tabs.Screen name="index" options={{ title: '首页' }} />
      <Tabs.Screen name="today" options={{ title: '今日' }} />
      <Tabs.Screen name="library" options={{ title: '知识库' }} />
      <Tabs.Screen name="review" options={{ title: '复习' }} />
      <Tabs.Screen name="profile" options={{ title: '我的' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 72,
    paddingTop: 7,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: { fontSize: 10, fontWeight: '800' },
  icon: { fontSize: 22, fontWeight: '900', lineHeight: 24 },
});
