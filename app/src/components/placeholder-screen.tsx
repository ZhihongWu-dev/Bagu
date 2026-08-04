import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { ScreenShell } from '@/components/screen-shell';
import { colors } from '@/theme/colors';

type Props = { icon: string; title: string; description: string };

export function PlaceholderScreen({ icon, title, description }: Props) {
  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.content}>
          <View style={styles.icon}><Text style={styles.iconText}>{icon}</Text></View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>V0.1</Text>
            <Text style={styles.cardText}>首个里程碑聚焦学习路径与答题闭环，这个页面将在下一阶段继续完善。</Text>
          </View>
        </View>
        <BottomNav />
      </SafeAreaView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 78, height: 78, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: colors.primary, fontSize: 32, fontWeight: '900' },
  title: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: 20 },
  description: { color: colors.textMuted, textAlign: 'center', marginTop: 9, lineHeight: 21 },
  card: { alignSelf: 'stretch', backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 20, padding: 18, marginTop: 28 },
  cardLabel: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  cardText: { color: colors.textMuted, lineHeight: 20, marginTop: 8 },
});

