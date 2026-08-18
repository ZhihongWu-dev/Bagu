import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { roleCatalog } from '@/data/role-catalog';
import { colors } from '@/theme/colors';
import type { TargetRole } from '@/types/course';

export default function SelectRoleScreen() {
  const { hydrated, setTargetRole } = useProgress();

  const selectRole = (role: TargetRole) => {
    setTargetRole(role);
    router.replace('/');
  };

  if (!hydrated) return <ScreenShell />;

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View>
            <Text style={styles.kicker}>选择学习方向</Text>
            <Text style={styles.title}>你的目标岗位是？</Text>
            <Text style={styles.subtitle}>先选一条主课程，之后可以在“我的”中随时切换，进度会保留。</Text>
          </View>

          <View style={styles.choices}>
            {roleCatalog.map((role) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`选择${role.title}`}
                key={role.id}
                onPress={() => selectRole(role.id)}
                style={({ pressed }) => [styles.choice, { borderColor: role.color, backgroundColor: role.softColor }, pressed && styles.pressed]}>
                <View style={[styles.icon, { backgroundColor: role.color }]}>
                  <AppIcon name={role.icon} size={30} color={colors.surface} />
                </View>
                <View style={styles.copy}>
                  <Text style={styles.choiceTitle}>{role.title}</Text>
                  <Text style={styles.choiceDescription}>{role.description}</Text>
                </View>
                <AppIcon name="chevron-right" size={24} color={role.darkColor} />
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 22, paddingBottom: 38 },
  kicker: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  title: { color: colors.text, fontSize: 31, lineHeight: 39, fontWeight: '900', marginTop: 8 },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 22, marginTop: 10 },
  choices: { gap: 14, marginTop: 34 },
  choice: { minHeight: 116, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 2, borderRadius: 8, padding: 16 },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.9 },
  icon: { width: 56, height: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  choiceTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  choiceDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 5 },
});
