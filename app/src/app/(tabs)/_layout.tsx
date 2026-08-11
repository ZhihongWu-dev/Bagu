import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { colors } from '@/theme/colors';
import type { AppIconName } from '@/types/icons';

const tabIcons: Record<string, AppIconName> = {
  index: 'path',
  library: 'book',
  review: 'review',
  profile: 'user',
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
        tabBarIcon: ({ color }) => <AppIcon name={tabIcons[route.name] ?? 'path'} size={23} color={color} strokeWidth={2.45} />,
      })}>
      <Tabs.Screen name="index" options={{ title: '学习' }} />
      <Tabs.Screen name="library" options={{ title: '知识' }} />
      <Tabs.Screen name="review" options={{ title: '复习' }} />
      <Tabs.Screen name="profile" options={{ title: '我的' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 70,
    paddingTop: 7,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: { fontSize: 10, fontWeight: '800' },
});
